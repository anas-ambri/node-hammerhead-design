var CandidateGenerationModule =  require( './candidateGenerationModule/');
var FoldModule = require ('./sfoldModule/');
var FoldCandidates = FoldModule.Folding.Fold.FoldCandidates;
var ExecuteFolding = FoldModule.Folding.Fold.ExecuteFolding;
var SFold = FoldModule.Folding.Fold.SFold;
var ParseUtilities = FoldModule.Parsing.ParseUtilities;
var Model = require('./model/');
var MeltingTemp = require('./meltingTemp/');
var Candidate = Model.DomainObjects.Candidate;
var CutsiteTypeCutsiteContainer = Model.DomainObjects.CutsiteTypeCutsiteContainer;
var Log = require('./log/').Log;
//var ReportObject = Model.DomainObjects.ReportObject;
var path = require('path');
var Specificity = require('./specificity/');
var FileSeparator = require('path').sep;
var AddCore = CandidateGenerationModule.AddCore;
var FitnessEvaluationModule = require('./fitnessEvaluation/');
var AlgorithmUtilities = require('./AlgorithmUtilities.js');


function ReportObject(request)
{
    this.Request = request;
    this.FileCount = 0;
    this.TotalCount = 0;
}

/*
    <summary>
        Adds a number to the amount that the report object is expecting to execute
    </summary>
    <param name='ammount'>The amount to add to the total count</param>
    <return>None</return>
*/
ReportObject.prototype.AddToExecutionCount = function (ammount)
{
    this.FileCount += ammount;
    this.TotalCount += ammount;
}

/*
    <summary>
        Callback executed by the asynchronous functions. The object then checks if it is the last execution 
        and if it is, it will initiate the next part
    </summary>
    <param name='part'>The next part that should be executed should all the asynchronous operations be complete</param>
    <return>None</return>
*/
ReportObject.prototype.ExecuteIfComplete = function (part)
{
    Log("Current execution count " + this.FileCount, "ReportObject.ExecuteIfComplete", 6);
    if (this.FileCount % 10 == 0)
    {
        this.Request.UpdateState("There are " + this.FileCount + ' executions left...');
        var progress = 100 * (this.TotalCount - this.FileCount);
        if (this.TotalCount != 0)
            this.Request.PartProgress = progress / this.TotalCount;
        else if (this.FileCount != 0)
            Log("Execution count is non-zero, but Total execution count is!", "ReportObject.ExecuteIfComplete", -10); //This signifies an error
        else
            this.Request.PartProgress = 0;

        this.Request.Callback(this.Request);
    }
    if(this.FileCount == 0)
    {
        switch (part)
        {
            case 1:
                this.Request.UpdateState("Completed folding of sequences");
                Log('Completed folding of sequences', 'ReportObject.ExecuteIfComplete', 3);
                this.Request.ResetAndSignalProgress(2);
                HandleRequestPart2(this);
                break;
            case 2:
                this.Request.UpdateState('Completed read operation on folding of sequences');
                Log('Completed read operation on folding of sequences', 'ReportObject.ExecuteIfComplete', 3);
                this.Request.ResetAndSignalProgress(3);
                HandleRequestPart3(this);
                break;
            case 3:
                this.Request.UpdateState('Completed folding targets with constraints');
                Log('Completed folding targets with constraints', 'ReportObject.ExecuteIfComplete', 3);
                this.Request.ResetAndSignalProgress(4);
                HandleRequestPart4(this);
                break;
            case 4:
                this.Request.UpdateState('Completed reading targets with constraints');
                Log('Completed reading targets with constraints', 'ReportObject.ExecuteIfComplete', 3);
                SaveRequest(this.Request);
                this.Request.ResetAndSignalProgress(5);
                HandleRequestPart5(this);
                break;
            case 5:
                this.Request.UpdateState('Completed folding target without constraints');
                Log('Completed folding target without constraints', 'ReportObject.ExecuteIfComplete', 3);
                this.Request.ResetAndSignalProgress(6);
                HandleRequestPart6(this);
                break;
            case 6:
                Log('All main folding complete', 'ReportObject.ExecuteIfComplete', 3);
                this.Request.ResetAndSignalProgress(7);
                HandleRequestPart7(this);
                break;
            case 7: //http://www.ncbi.nlm.nih.gov/blast/Blast.cgi?CMD=Get&RID=75M5HJHC015&FORMAT_TYPE=Text
                this.Request.UpdateState('Completed specificity check');
                Log('Completed specificity check', 'ReportObject.ExecuteIfComplete', 3);
                this.Request.Callback(this.Request);
                this.Request.ResetAndSignalProgress(8);
                HandleRequestPart8(this);
            case 8:
                Log('All Completed' , 'ReportObject.ExecuteIfComplete', 3);
                this.Request.Completed = true;
                this.Request.PartProgress = 100;
                this.Request.Callback(this.Request);
                
                break;
        }
    }
}

/*
    <summary>
        Serializes the request object into a string and saves it unto a file.
        It also saves the cutsite objects and saves them in their respective object for easy access
    </summary>
    <param name='request'>The request object to be saved recursively</param>
    <return>None</return>
*/
function SaveRequest(request) {

    var str = JSON.stringify(request);
    var fs = require('fs');
    fs.writeFileSync(path.join(request.ID, 'requestState.json'), str);
    var cutsiteTypesLength = request.CutsiteTypesCandidateContainer.length;
    for (var ii = 0; ii < cutsiteTypesLength; ++ii) {
        var cutsiteTypeCutsiteContainer = request.CutsiteTypesCandidateContainer[ii];
        for (var jj = 0; jj < cutsiteTypeCutsiteContainer.Cutsites.length ; ++jj) {
            var cutsite = cutsiteTypeCutsiteContainer.Cutsites[jj];
            var fwrite = JSON.stringify(cutsite);
            fs.writeFileSync(path.join(request.ID, cutsite.ID, 'results.json'), fwrite);
        }
    }
}

/*
    <summary>
        Counts the number of raw candidates, on a cutsite basis.
    </summary>
    <param name='rawCandidates'>The raw candidates from the candidate generation module</param>
    <return>None</return>
*/
function CountCandidatesFromRaw(rawCandidates)
{
    var res = 0;
    for (var ii = 0; ii < rawCandidates.length; ++ii)
    {
        res += rawCandidates[ii].length;
    }
    return res;
}

/*
    <summary>
    </summary>
    <param name='ammount'>The amount to add to the total count</param>
    <return>None</return>
*/
function VerifyParameters(request)
{
    var allOk = true;
    if (request.Preferences.left_arm_min < 1) {
        request.UpdateState("Left arm minumum is less than 1!");
        allOk = false;
    }
    if (request.Preferences.right_arm_min < 1) {
        request.UpdateState("Right arm minumum is less than 1!");
        allOk = false;
    }
    if (request.Preferences.left_arm_max > 16) {
        request.UpdateState("Left arm max is more than 16!");
        allOk = false;
    }
    if (request.Preferences.right_arm_max > 16) {
        request.UpdateState("Right arm max is more than 16!");
        allOk = false;
    }

    if ((request.Preferences.left_arm_max - request.Preferences.left_arm_min)
        * (request.Preferences.right_arm_max - request.Preferences.right_arm_min) > 100) {
        request.UpdateState("The product of the difference of the arm lengths exceeds 100! Too many candidates will be generated. (i.e. (rmax - rmin)*(lmax-lmin) > 100 )");
        allOk = false;
    }

    if (request.Preferences.naEnv == 0) {
        request.Preferences.naEnv = null;
    }
    if (request.Preferences.mgEnv == 0) {
        request.Preferences.mgEnv = null;
    }

    if (request.Preferences.naEnv != null && request.Preferences.naEnv < 0) {
        request.UpdateState("Negative sodium concentration is not allowed!");
        allOk = false;
    }

    if (request.Preferences.mgEnv !=null && request.Preferences.mgEnv < 0) {
        request.UpdateState("Negative magnesium concentration is not allowed!");
        allOk = false;
    }

    if (request.coreTypeId < 0 || request.coreTypeId > 1)
    {
        request.UpdateState("ID of core type provided is not recognized");
        allOk = false;
    }
    return allOk;
}

function EstimateTime(request) {
    var possibleCutsitesTypes = request.Preferences.cutsites;
    var count = 0;
    for (var ii = 0; ii < possibleCutsitesTypes.length; ++ii)
    {
        count += CandidateGenerationModule.FindCutsites(AlgorithmUtilities.DnaToRna(request.TargetSequence), possibleCutsitesTypes[ii]).length;
    }
    var armL = request.Preferences.left_arm_max - request.Preferences.left_arm_min;
    var armR = request.Preferences.right_arm_max - request.Preferences.right_arm_min;
    var est = armL * armR * count / 100 * 60
	return est;
}



/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* *****************************************************  Part 1 ***************************************************** */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */

/*  Executes the first part of the request, namely the generation of the candidates and the folding thereof
*   will also chain on to the second part
*/
function HandleRequestPart1(request)
{
    var startime = AlgorithmUtilities.ElapsedTime('Request Begun');
    Log(startime, 'HandleRequestPart1', 0);
    request.UpdateState(startime);
    var estimate = EstimateTime(request);
    Log('Estimate is ' + estimate + ' minutes', 'HandleRequestPart1', 0);
    
    setTimeout(function timeOut() { _handleRequestPart1(request) }, 0);
    return estimate;
}

function _handleRequestPart1(request)
{
    request.TargetSequence = AlgorithmUtilities.DnaToRna(request.TargetSequence);

    if (!VerifyParameters(request))
    {
        Log("One or more parameters have bad values!", "ERROR HandleRequesrPart1", 0);
        request.UpdateState("One or more parameters have bad values!");
        request.ResetAndSignalProgress(1);
        request.ErrorContainer.push( {'message': 'invalid parameters' } );
        return;
    }

    //Make directory for request
    var fs = require('fs');
    AlgorithmUtilities.DeleteFolderRecursive(request.ID);
    fs.mkdirSync(request.ID);


    request.UpdateState("Request being processed");
    Log("Request started being processed", "HandleRequestPart1", 0);
    request.ResetAndSignalProgress(1);


    var possibleCutsitesTypes = request.Preferences.cutsites;
    var CutsiteTypesCandidateContainer = new Array();
    

    var reportObj = new ReportObject(request);
    var numberOfCandidatesGenerated = 0;
    var numberOfCandidatesGeneratedAndCleansed = 0;
	//For each cutsite TYPE
	for(var ii = 0 ; ii < possibleCutsitesTypes.length ; ++ii)
	{
	    var cutsiteTypeCutsiteContainer = new CutsiteTypeCutsiteContainer(possibleCutsitesTypes[ii]);
        var cutSites = new Array();
        
        request.UpdateState("Generating candidates candidate(s) for cutsite type " + cutsiteTypeCutsiteContainer.Type);
        Log("Generating candidates candidate(s) for cutsite type " + cutsiteTypeCutsiteContainer.Type, "HandleRequestPart1", 0);
	    //Generate ii cutsites and jj candidates         
		var rawCandidatesPerCutsite = CandidateGenerationModule.GenerateCandidates 
			(
				request.TargetSequence,
				possibleCutsitesTypes[ii], 
				{
				    'left_arm_min': request.Preferences.left_arm_min,
				    'right_arm_min': request.Preferences.right_arm_min,
				    'left_arm_max': request.Preferences.left_arm_max,
				    'right_arm_max': request.Preferences.right_arm_max,
				    'coreTypeId': request.coreTypeId
				}
			);
        //Find the candidate count
		var candidateCountRaw = CountCandidatesFromRaw(rawCandidatesPerCutsite);
	    //Log the candidate count
		var logString = "Created " + candidateCountRaw + " candidate(s) for cutsite type " + cutsiteTypeCutsiteContainer.Type;
		request.UpdateState(logString);
		Log(logString, "HandleRequestPart1", 1);
        
		numberOfCandidatesGenerated += candidateCountRaw; //Keep count of total generated candidates

		request.Callback(request);
	    //Clense candidates of too low Melting temperature
		rawCandidatesPerCutsite = MeltingTemp.CleanseCandidates(rawCandidatesPerCutsite,request.Preferences);
		candidateCountRaw = CountCandidatesFromRaw(rawCandidatesPerCutsite);
		numberOfCandidatesGeneratedAndCleansed += candidateCountRaw; //Keep count of total generated candidates after cleansing
	    //Add promoter to candidate
        //if(request.Preferences.promoter != undefined && request.Preferences.promoter.length >0 )
		//    rawCandidatesPerCutsite = CandidateGenerationModule.AppendPromoterToMany(rawCandidatesPerCutsite, request.Preferences.promoter, 3);//The 3 is the amount that the promoter we use allows to be identical (e.g. if the promoter is GUGGC and the candidate is ABDDGU , then we can recycle the DGU, but only GU is equal so only GU)
		logString = "Melting temperature computed. New number of candidates is " + candidateCountRaw + " after removing unfit candidates for cutsite type " + cutsiteTypeCutsiteContainer.Type;
		request.UpdateState(logString);
		Log(logString, "HandleRequestPart1", 1);


		for(var jj = 0; jj < rawCandidatesPerCutsite.length; ++jj)
        //For each cutsite
		{
		    var generatedCutsiteId = possibleCutsitesTypes[ii] + jj.toString();
		    logString = "Asynchrnously queueing the fold of cutsite " + generatedCutsiteId + ' candidates';
		    request.UpdateState(logString);
		    Log(logString, "HandleRequestPart1", 1);

		    var candidates = new Array();
            var cutsiteCandidates = rawCandidatesPerCutsite [jj];
            for(var kk = 0; kk < cutsiteCandidates.length; ++kk)
            {
                var rawCandidate = cutsiteCandidates[kk];
                var seqWithCore = AddCore(rawCandidate.seq, rawCandidate.cut, Model.DomainObjects.CATALITIC_CORES[request.coreTypeId], request.coreTypeId);
                var newCandidate  = 
                new Candidate( 
                    seqWithCore,
                    rawCandidate.cut + (request.coreTypeId == 0 ? 0 : 3), /*Catalitic core start (3 accounts for TAA)*/
                    /*Generate candidate ID id*/ kk.toString(), 
                    request.coreTypeId, 
                    request.ID ,
                    /*Create cutsite ID*/generatedCutsiteId,
                    rawCandidate.targetLocation,
                    rawCandidate.MeltingTemperature,
                    rawCandidate.left,
                    rawCandidate.right
                    );
                candidates.push(newCandidate);
            }
            //Save the cutsite location at the cutsite level.
            var locationOnTarget = -1;
            if(candidates.length  != 0)
                locationOnTarget = candidates[0].cutSiteLocation;
            
            cutSites.push
            (
                {
                    'Candidates' : candidates,
                    'ID': generatedCutsiteId,
                    'Location': locationOnTarget,
                    'BaseSeq': cutsiteCandidates.BaseSequence,
                    'BaseCutindex': cutsiteCandidates.BaseCutindex,
                    'SpecificityFitness': -1,
                    'OfftargetLocations':[]
                }
            );

            FoldCandidates 
            ( 
                { 
                    'ID': generatedCutsiteId,
                    'requestID':request.ID
                }, 
                candidates, 
                reportObj
             ) ; 
		}
		cutsiteTypeCutsiteContainer.Cutsites = cutSites;
		CutsiteTypesCandidateContainer.push(cutsiteTypeCutsiteContainer);
	}
	request.Callback(request);
	request.CutsiteTypesCandidateContainer = CutsiteTypesCandidateContainer;
	if (numberOfCandidatesGenerated == 0)
	{
	    request.UpdateState("No candidates were generated!");
	    Log("No candidates were generated!", "HandleRequestPart1", 0);
	    request.Completed = true;
	}
	else if (numberOfCandidatesGeneratedAndCleansed == 0)
	{
	    request.UpdateState("All generated candidates did not meet minimal annealing temperature requirements!");
	    Log("All generated candidates did not meet minimal annealing temperature requirements!", "HandleRequestPart1", 0);
	    request.Completed = true;
	}
	else
	{
	    Log("Waiting for foldings ...", "HandleRequestPart1", 0);
	    request.UpdateState("Waiting for foldings ...");
	}
	request.Callback(request);
}
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* *****************************************************  Part 2 ***************************************************** */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
function _handleRequestPart2(reportObject) 
{
    var request = reportObject.Request;
    var cutsiteTypes = request.Preferences.cutsites;
    for(var ii = 0; ii < cutsiteTypes.length;++ii)
    {
        var cutsiteTypeContainer = request.CutsiteTypesCandidateContainer[ii].Cutsites;
        for (var jj = 0; jj < cutsiteTypeContainer.length; ++jj)
        {
            var cutsiteContainer = cutsiteTypeContainer[jj];
            var parsedCandidates = null;
            try {
                parsedCandidates = ParseUtilities.ParseSFoldResults(request.ID, cutsiteContainer.ID);
            }
            catch (exception) {
                if (exception.message.indexOf('ENOENT') != -1) {
                    Log(" File could not be found ! Message: " + exception.message, "ERROR @ HandleRequestPart2 excution", -10);
                    request.ErrorContainer.push(exception);
                }
                else
                    throw exception;
            }
            var candidates = cutsiteContainer.Candidates;
            Log("Number of candidates in request: " + candidates.length + ", number of candidates parsed: " + parsedCandidates.length, "HandleRequestPart2 execution", 0);
            if (candidates.length != parsedCandidates.length)
            {
                Log("*** Failed execution! Number of parsed candidates and expected candidates in request:cutsite " + request.ID +':'+ cutsiteContainer.ID + " is different *** ", "ERROR in HandleRequestPart2 execution", 0);
            }
            for (var kk = 0; kk < candidates.length && kk < parsedCandidates.length ; ++kk)
            {
                candidates[kk].StructuresSFold = parsedCandidates[kk];
            }
        }
    }
    reportObject.ExecuteIfComplete(2);
}

/*  
*   Parses the results that were sent to be executed by part 1.
*/
function HandleRequestPart2(reportObj)
{
    reportObj.Request.UpdateState('Parsing fold results for candidates...');
    Log("Entered part 2 for " + reportObj.Request.ID, "HandleRequestPart2", 3);
    var reportObject = new ReportObject(reportObj.Request);
    setTimeout(function () { _handleRequestPart2(reportObject); }, 4000); // execute async
}
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* *****************************************************  Part 3 ***************************************************** */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
function _handleRequestPart3(reportObject)
{
    var request = reportObject.Request;
    var seq = request.TargetSequence;
    var constraintsArr = new Array();
    var virtualCandidates = new Array();
    for (var ii = 0; ii < request.CutsiteTypesCandidateContainer.length; ++ii)
    {
        var cutsiteType = request.CutsiteTypesCandidateContainer[ii];
        for (var jj = 0; jj < cutsiteType.Cutsites.length; ++jj)
        {
            var cutsite = cutsiteType.Cutsites[jj];
            virtualCandidates.push
                (
                    {
                        'requestID':request.ID,
                        'cutsiteID': cutsite.ID,
                        'ID': 'Target',
                        'sequence':request.TargetSequence
                    }
                );
            var constraint = { 'left': cutsite.Location - (request.Preferences.left_arm_max - 1), 'right': (request.Preferences.right_arm_max + request.Preferences.left_arm_max + 2) };
            constraint.left = constraint.left > 0 ? constraint.left : 1;
            constraint.right = ((constraint.right + cutsite.Location - 1) < seq.length) ? constraint.right : (seq.length - cutsite.Location);
            constraintsArr.push(constraint);
        }
    }
    reportObject.AddToExecutionCount(virtualCandidates.length);
    for (var ii = 0; ii < virtualCandidates.length; ++ii)
    {
        ExecuteFolding(virtualCandidates[ii], constraintsArr[ii], reportObject, true);
    }
}

/*  
   Finds the fitness of the parsed results. of part 2.
   Executes the constrained folding of the target sequence
*/
function HandleRequestPart3(reportObj) {
    var request = reportObj.Request;
    Log("Entered part 3 for " + request.ID, "HandleRequestPart3", 3);
    reportObj.Request.UpdateState('Computing ribozyme shape fitness ... ');
    Log('Computing ribozyme shape fitness ... ', "HandleRequestPart3", 3);
    FitnessEvaluationModule.CaculateCandidateFoldingFitness(request);
    reportObj.Request.UpdateState('Saving request execution ... ');
    SaveRequest(request);
    reportObj.Request.UpdateState('Folding whole sequence ... ');
    var reportObject = new ReportObject(reportObj.Request);
    setTimeout(function () { _handleRequestPart3(reportObject); }, 4000); // execute async
    
}
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* *****************************************************  Part 4 ***************************************************** */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
function _handleRequestPart4(reportObj) {
    var request = reportObj.Request;
    
    var cutsiteTypes = request.Preferences.cutsites;
    for (var ii = 0; ii < cutsiteTypes.length; ++ii) {
        var cutsiteTypeContainer = request.CutsiteTypesCandidateContainer[ii].Cutsites;
        for (var jj = 0; jj < cutsiteTypeContainer.length; ++jj) {
            //Set execution count for completion of part 4
            reportObj.AddToExecutionCount(1); //1 per cutsite in the cutsite type
            //Construct file paths
            var file_pattern_begin = request.ID + FileSeparator + cutsiteTypeContainer[jj].ID + FileSeparator;
            var file_pattern_end = FileSeparator;//'\\structures\\';
            var file_pattern = file_pattern_begin + 'Target' + file_pattern_end;
            var fileSummary = file_pattern + '10structure_2.out';
            var fileStructures = file_pattern + '10structure.out';
            var index = jj;
            Log("Sending parse request for " + cutsiteTypeContainer[jj].ID + ' target shape with constraints', 'HandleRequestPart4 execution', 1);

            setTimeout
            (
                function (args)
                {
                    
                    var fileSummary = args[1];
                    var fileStructures = args[2];
                    var cutsiteContainer = args[0];
                    var reportObj = args[3];
                    Log("Parsing " + cutsiteContainer.ID + ' target shape with constraints', 'HandleRequestPart4 execution', 1);

                    var Structs = null;
                    try
                    {
                        //Parse structures
                        var Structs = ParseUtilities.ParseStructuresSummary(fileSummary);
                        ParseUtilities.ParseStructure(fileStructures, Structs);
                    }
                    catch (exception) {
                        if (exception.message.indexOf('ENOENT') != -1) {
                            Log(" File could not be found ! Message: " + exception.message, "ERROR @ HandleRequestPart4 excution", -10);
                            request.ErrorContainer.push(exception);
                        }
                        else
                            throw exception;
                    }

                    Log("Computing " + cutsiteContainer.ID + ' LFE under constraints ', 'HandleRequestPart4 execution', 1);
                    //Find average LFE
                    var lowestFreeEnergy = 0;
                    for (var kk = 0; kk < Structs.length; ++kk) {
                        lowestFreeEnergy += Structs[kk].LowestFreeEnergy * Structs[kk].Frequency;
                    }
                    cutsiteContainer.ConstrainedSFoldStructures = Structs;
                    cutsiteContainer.AverageLowestFreeEnergy = lowestFreeEnergy;
                    reportObj.FileCount -= 1;
                    reportObj.ExecuteIfComplete(4);
                },
                500,
                [cutsiteTypeContainer[jj], fileSummary, fileStructures, reportObj]
            );//Execute Async
        }
    }

}

/*
    Parses the result of target sequence folding with constraints on a cutsite-basis
*/
function HandleRequestPart4(reportObj) {
    var request = reportObj.Request;
    Log("Entered part 4 for " + request.ID, "HandleRequestPart4", 3);
    reportObj.Request.UpdateState('Parsing fold results for target cutsite fitness... ');
    var reportObject = new ReportObject(request);
    setTimeout(function () { _handleRequestPart4(reportObject); }, 4000); // execute async
}


/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* *****************************************************  Part 5 ***************************************************** */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
function _handleRequestPart5(reportObj) {
    var request = reportObj.Request;
    var fs = require('fs');
    var targetSeqFile = request.ID + '/Target.seq';
    fs.writeFileSync(targetSeqFile, '> File for target sequence\n' + request.TargetSequence);
    var resultDir = request.ID + '/Target';
    AlgorithmUtilities.DeleteFolderRecursive(resultDir);

    fs.mkdirSync(resultDir);
    reportObj.AddToExecutionCount(1);
    SFold(targetSeqFile, resultDir, reportObj, null, 5);

}


/*
    Folds the sequence unconstrained
*/
function HandleRequestPart5(reportObj) {
    var request = reportObj.Request;
    Log("Entered part 5 for " + request.ID, "HandleRequestPart5", 3);
    reportObj.Request.UpdateState('Executing Target default folding ');
    var reportObject = new ReportObject(request);
    setTimeout(function () { _handleRequestPart5(reportObject); }, 4000); // execute async
}


/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* *****************************************************  Part 6 ***************************************************** */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
function _handleRequestPart6(reportObj) {
    var request = reportObj.Request;
    var resultDir = request.ID + '/Target';
    var summaryFile = resultDir + '/' + '10structure_2.out';
    var structureFile = resultDir + '/' + '10structure.out';
    //Parse structures
    try{
        var Structs = ParseUtilities.ParseStructuresSummary(summaryFile);
        ParseUtilities.ParseStructure(structureFile, Structs);
    }
    catch (exception) {
        if (exception.message.indexOf('ENOENT') != -1) {
            Log(" File could not be found ! Message: " + exception.message, "ERROR @ HandleRequestPart6 excution", -10);
            request.ErrorContainer.push(exception);
        }
        else
            throw exception;
    }

    Log("Computing " + request.ID + ' LFE without constraints ', 'HandleRequestPart6 execution', 1);
    //Find average LFE
    var lowestFreeEnergy = 0;
    for (var kk = 0; kk < Structs.length; ++kk) {
        lowestFreeEnergy += Structs[kk].LowestFreeEnergy * Structs[kk].Frequency;
    }
    request.SFoldStructures = Structs;
    request.AverageLowestFreeEnergy = lowestFreeEnergy;
    Log("Completed Parsing target fold", 'HandleRequestPart6 execution', 1);
    reportObj.ExecuteIfComplete(6);
}


/*
    Parses the folding of the unconstrained target
*/
function HandleRequestPart6(reportObj) {
    var request = reportObj.Request;
    Log("Entered part 6 for " + request.ID, "HandleRequestPart6", 3);
    reportObj.Request.UpdateState('Parsing fold results for target cutsite fitness without constraints... ');
    var reportObject = new ReportObject(request);
    setTimeout(function () { _handleRequestPart6(reportObject); }, 4000); // execute async
}


/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* *****************************************************  Part 7 ***************************************************** */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
function _handleRequestPart7(reportObj) {
    if (reportObj.Request.InVivoOrganism.length != 0) //If in VIVO
        Specificity.QueryBlastForRequest(reportObj);
    else {
        Log("No request sent. No organism specified.", "HandleRequestPart7", 3);
        reportObj.ExecuteIfComplete(7); //Exit and its all
    }
}

/*
    Computes fitness from all gathered data, compresses object and saves it into a file
*/
function HandleRequestPart7(reportObj) {
    var request = reportObj.Request;
    Log("Entered part 7 for " + request.ID, "HandleRequestPart7", 3);

    Log("Sending blast query....", "HandleRequestPart7", 3);
    var reportObject = new ReportObject(request);
    setTimeout(function () { _handleRequestPart7(reportObject); }, 4000); // execute async


}

/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* *****************************************************  Part 8 ***************************************************** */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */
/* ******************************************************************************************************************* */


/*
    Computes fitness from all gathered data, compresses object and saves it into a file
*/
function HandleRequestPart8(reportObj)
{
    var request = reportObj.Request;
    Log("Entered part 8 for " + request.ID, "HandleRequestPart8", 3);
    
    Log("Computing fitness from gathered data..", "HandleRequestPart8", 3);
    reportObj.Request.UpdateState("Computing fitness from gathered data..");
    FitnessEvaluationModule.EvaluateFitnesses(request);

    Log("Pareto Front ranking .... " , "HandleRequestPart8", 5);
    request.UpdateState("Pareto front computation started");
    FitnessEvaluationModule.ParetoFrontForRequest(request);
    request.UpdateState("Pareto front computation completed");

    for (var ii = 0 ; ii < request.CutsiteTypesCandidateContainer.length; ++ii) {
        var cutsiteType = request.CutsiteTypesCandidateContainer[ii];
        
        for (var jj = 0 ; jj < cutsiteType.Cutsites.length; ++jj) {
            var cutsite = cutsiteType.Cutsites[jj];
            
            for (var kk = 0; kk < cutsite.Candidates.length; ++kk) {
                var cand = cutsite.Candidates[kk];
                console.log(cand.rank);
            }
        }

    }
    console.log("done");
    //Writing uncompressed data
    var str = JSON.stringify(request);
    var fs = require('fs');
    fs.writeFileSync(path.join(process.cwd(), request.ID, 'requestStateUncompressed.json'), str);

    reportObj.Request.UpdateState('Compressing results');
    for (var ii = 0; ii < request.CutsiteTypesCandidateContainer.length; ++ii)
    {
        var cutsiteType = request.CutsiteTypesCandidateContainer[ii];
        for (var jj = 0; jj < cutsiteType.Cutsites.length; ++jj)
        {
            var cutsite = cutsiteType.Cutsites[jj];
            var SFoldStructures = cutsite.ConstrainedSFoldStructures;
            for (var kk = 0; kk< SFoldStructures.length; ++kk)
            {
                var struct = SFoldStructures[kk];
                AlgorithmUtilities.CompressStructureInfo(struct);
            }

            var candidates = cutsite.Candidates;
            for (var kk = 0; kk < candidates.length; ++kk)
            {
                var structures = candidates[kk].StructuresSFold;
                for (var mm = 0; mm < structures.length; ++mm)
                {
                    AlgorithmUtilities.CompressStructureInfo(structures[mm]);
                }
                
            }
            AlgorithmUtilities.CompressCandidates(candidates);
        }
    }

    for (var ii = 0 ; ii < request.SFoldStructures ; ++ii)
        CompressStructureInfo(request.SFoldStructures[ii]);
    AlgorithmUtilities.CompressObjectArrayIntoTable(request.SFoldStructures, ["EnergyInterval", "Frequency", "LowestFreeEnergy", "ConnectedPairs"]);
    SaveRequest(request);
    Log("Compressed and saved request " + request.ID, "HandleRequestPart8", 3);

    
    var endtime = AlgorithmUtilities.ElapsedTime('Request Ended');
    Log(endtime, 'HandleRequestPart8', 0);
    request.UpdateState(endtime);

    //Delete all folders, except json files
    var fs = require('fs'),
	rimraf = require('rimraf');
    fs.readdir(process.cwd(), function(err, files){
	if(!err){
	    files.forEach(function(file){
		if(fs.statSync(file).isDirectory()){
		    rimraf(file,function(){});
		}
	    });
	}
    });

    var reportObject = new ReportObject(request);
    reportObj.ExecuteIfComplete(8);

}


exports.HandleRequestPart1 = HandleRequestPart1; //Create candidates and clense according to Melting T and queues candidates folds
exports.HandleRequestPart2 = HandleRequestPart2; //Reads folding for candidates
exports.HandleRequestPart3 = HandleRequestPart3; //Evaluates fitness for candidate folding and queues Target folding
exports.HandleRequestPart4 = HandleRequestPart4; //Parses constrained folding
exports.HandleRequestPart5 = HandleRequestPart5; //Queues unconstrained target folding
exports.HandleRequestPart6 = HandleRequestPart6; //Parses unconstrainted target folding
exports.HandleRequestPart7 = HandleRequestPart7; //Puts query blast for cutsites and parses results
exports.HandleRequestPart8 = HandleRequestPart8; //Figures fitnesses from gathered data, computes pareto front, compresses data, sends
exports.ReportObject = ReportObject;
