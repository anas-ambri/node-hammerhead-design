var Log = require('./../log/').Log;

var config = require('../config/config.json');
var AlgorithmUtilities = require('../AlgorithmUtilities.js');
var sfold_path = config.env.sfold_path;
var unafold_path = config.env.unafold_path;

//This variable holds how many folds are executing at a time, so that no more than BUFFER_MAX execute simultaneously.
//(any
var BufferCount = 0;
var BUFFER_MAX = 5;

var SFOLD_COMMAND = process.platform === 'win32' ? 'sfold.exe' : sfold_path;
var UNAFOLD_COMMAND = process.platform === 'win32' ? 'sfold.exe' : unafold_path;

function Fold(){}

var SFOLD_CALL_NO_CONSTRAINT = SFOLD_COMMAND+" -o %OUTDIR% %SEQUENCEFILE%";
var SFOLD_CALL = SFOLD_COMMAND+" -f %CONSTRAINT% -o %OUTDIR% %SEQUENCEFILE%";
var QUEUE = new Array();
/*Takes in file containing a sequences separated by an endline as well as the output folder.
The reportObject to execute a call-back on and finally, the constraint file if any*/
Fold.SFold = function( sequenceFile, targetFolder , reportObj ,constraintFile , callbackArg )
{
	Log('Started folding ' + sequenceFile, 'Fold.SFold', 7);
	var sys = require('sys');
	var exec = require('child_process').exec;
	var command = '';
	if (constraintFile == undefined || constraintFile == null)
	{
		command = SFOLD_CALL_NO_CONSTRAINT
		.replace('%OUTDIR%',targetFolder)
		.replace('%SEQUENCEFILE%',sequenceFile);
	}
	else
	{
		command = SFOLD_CALL_NO_CONSTRAINT
		.replace('%OUTDIR%',targetFolder)
		.replace('%SEQUENCEFILE%',sequenceFile)
		.replace('%CONSTRAINT%',constraintFile);
	}
	if (BufferCount < BUFFER_MAX)
	{
	    BufferCount += 1;
	    exec(command,
            {
                'timeout' : 600000 //10 min timeout
            }
            ,
            function CommandExecuteCallback(error, stdout, stderr) {
                BufferCount -= 1;
                if (error !== null) {
                    Log("Could not call sfold with " + sequenceFile + "," + targetFolder + "constraintFile", "ERROR Fold.SFold", 0);
                    Log("stdout sfold :" + command + ": " + stdout, "SFold", 3);
                    Log("stderr sfold :" + command + ": " + stderr, "SFold", 0);
                    var request = reportObj.request; //Using reportObj from parent scope can cause race-condition if context switches. e.g. another request gets here
                    request.ErrorContainer.push(error);
                    if (request.Completed != true) //only on first erroneous callback
                    {
                        request.Completed = true;
                        request.Callback(request);
                    }
                    return;
                }

                Log("stdout sfold :" + command + ": " + stdout, "SFold", 3);
                Log("stderr sfold :" + command + ": " + stderr, "SFold", 0);

                reportObj.FileCount = reportObj.FileCount - 1;
                reportObj.ExecuteIfComplete(callbackArg);

                if (QUEUE.length > 0)
                {
                    var args = QUEUE.shift();
                    Fold.SFold(args[0], args[1], args[2], args[3], args[4]);
                }
            }
        );
	    Log('Completed sending fold ' + sequenceFile, 'Fold.SFold', 7);
	}
	else
	{

	    Log('Fold queued, too many folds executing ' + sequenceFile + '. Buffer ' + BufferCount, 'Fold.SFold', 4);
	    QUEUE.push([sequenceFile, targetFolder, reportObj, constraintFile, callbackArg]);
	    //setTimeout(function () { Fold.SFold(sequenceFile, targetFolder, reportObj, constraintFile, callbackArg); }, 10000); //Attempt to execute the fold again in 4 seconds
	}
	
}



Fold.UnaFold = function ( file, options)
{
    
}



//Candidate
//	ID
//	cutsiteID
//	requestID
//	sequence
//	
//
Fold.ExecuteFolding = function(candidate, constraints, reportObj, target )
{
    if (target == undefined)
        target = false;

    if (!target)
    {
        Log('Executing fold of candidate ' + candidate.cutsiteID + ':' + candidate.ID, 'Fold.ExecuteFolding', 6);
        var fs = require('fs');
        var seqFile = candidate.requestID + '/' + candidate.cutsiteID + '/' + candidate.ID + '.seq';
        fs.writeFileSync(seqFile, '> File for  ' + candidate.ID + '\n' + candidate.sequence);
        var newDir = candidate.requestID + '/' + candidate.cutsiteID + '/' + candidate.ID;

        AlgorithmUtilities.DeleteFolderRecursive(newDir);
        fs.mkdirSync(newDir);
        Fold.SFold(seqFile, newDir, reportObj,null, 1);
        Log('Completed sending fold request of candidate ' + candidate.ID, 'Fold.ExecuteFolding', 6);
    }
    else
    {
        Log('Executing fold of target with open cusite ' + candidate.cutsiteID , 'Fold.ExecuteFolding', 6);
        var fs = require('fs');
        var seqFile = candidate.requestID + '/' + candidate.cutsiteID + '/' + candidate.ID + '.seq';
        var constraintFile = candidate.requestID + '/' + candidate.cutsiteID + '/' + candidate.ID + '_constraint.seq';
        fs.writeFileSync(seqFile, '> File for  ' + candidate.ID + '\n' + candidate.sequence);
        fs.writeFileSync(constraintFile, 'P ' + constraints.left + ' 0 ' + constraints.right);
        var newDir = candidate.requestID + '/' + candidate.cutsiteID + '/' + candidate.ID;
        AlgorithmUtilities.DeleteFolderRecursive(newDir);
        fs.mkdirSync(newDir);
        Fold.SFold(seqFile, newDir, reportObj, constraintFile,3);
        Log('Completed sending fold of target with open cusite ' + candidate.cutsiteID, 'Fold.ExecuteFolding', 6);
    }
}



//	cutSite : Id info
//		ID : Id of the cutsite
//		requestID : Id of the request
//  candidateArray : array of candidates to fold
//  reportObj : Master object that sees it all

Fold.FoldCandidates = function ( cutSite , candidateArray, reportObj)
{
	Log('Folding request being sent for candidates for cutSite ' + cutSite.ID, 'Fold.FoldCandidates',5);
    var fs = require('fs');
    var newDir = cutSite.requestID + '/' + cutSite.ID;
    AlgorithmUtilities.DeleteFolderRecursive(newDir);

	fs.mkdirSync(newDir)
    //We need to wait untill all the candidates are folded
	reportObj.AddToExecutionCount (candidateArray.length );
	for(var ii = 0; ii < candidateArray.length ; ++ii )
	{
		Fold.ExecuteFolding({'ID' :candidateArray[ii].ID, 'cutsiteID': cutSite.ID, 'requestID': cutSite.requestID, 'sequence':candidateArray[ii].Sequence },
					'',
					reportObj
					);
	}
	Log('Finished Folding request being sent for candidates for cutSite ' + cutSite.ID, 'Fold.FoldCandidates', 5);
}


var test = false;
if(test) //obsolete test
{
	Fold.FoldCandidates ( {'ID' : 'cutSite'+0, 'requestID':'test'}, ['UUA CUG GAA CUG AUG AGU CCG UGA GGA CGA A AC AUC UGG AGA'], {'FileCount':0}  ); 
	console.log('ex');
}

exports.Fold = Fold;
