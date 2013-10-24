var FileSeparator = require('path').sep;

var Model = require('../model/');
var Candidate = Model.DomainObjects.Candidate;
var StructureInfo = Model.DomainObjects.StructureInfo;
var Log = require('./../log/').Log
function RemoveAllValuesFromArray(arr,val)
{
	var index = arr.indexOf(val);
	while(index != -1)
	{
		arr.splice(index, 1);
		index = arr.indexOf(val);
	}
}




function ParseUtilities(){}


//Parses structurex.out containing GCG connect info of the pairs.
// File is read as [Node3]	[NodeBase]	[NodeBefore]	[NodeAfter]  [NodeConnectedTo]	[NodeIndex]
// NodeConnectedTo is zero if it is free
// Takes in the structure, which it modifies to add the pairs
// from site, it is structureX.out
// From local, 10structure.out
// TODO: change for new one file type
ParseUtilities.ParseStructure = 
function (filePath,Structs)
{
    var fs = require('fs');
	var data = fs.readFileSync(filePath, 'ascii');
	var structsSplit = data.split('Structure');
	for (var jj = 1; jj < structsSplit.length; ++jj)//1 since first split (before Structure) is empty
	{
	    var splited = structsSplit[jj].split('\n');
	    //First line is a header
	    //node breakdown [0]=positon,[1]=nucleotide base, [2],[3]=prev,next, [4]=connected-to, [5]=node
	    for (var ii = 1; ii < (splited.length - 1) ; ++ii) //1 due to the first line which labels the structure, -1 due to empty line at eof
	    {
	        var node = splited[ii].split(' ');
	        RemoveAllValuesFromArray(node, '');//remove all empty entries
	        //Skip non-connection strings
	        if (node.length != 6)
	            continue;
	        var connectsTo = parseInt(node[4])
	        if (connectsTo != 0) //If the value is zero, it is not connected to anything
	        {
	            Structs[jj-1].AddPair(parseInt(node[0]), connectsTo, node[1]);
	            //console.log(node.join(','));
	        }
	        else {
	            Structs[jj-1].AddPair(parseInt(node[0]), -1, node[1])
	        }
	    }
	    reading = false;
	}
}


// Parses the summary of the structures that contains 
// minimum free energy and max free energy, and frequency.
// Returns an array of StructureInfo containing the data
// Generally 10structure_2.out
ParseUtilities.ParseStructuresSummary=
function(file)
{
    var fs = require('fs');
	var StructureInfos = new Array();
	var data = fs.readFileSync(file, 'ascii');
	var splited = data.split('\n');
	//console.log("Data lines:"+splited.length);
	for(var ii = 0; ii < (splited.length - 1); ++ii)//-1 due to empty line at eof
	{
		var struct = splited[ii].split(' ');
		RemoveAllValuesFromArray(struct,'');
		StructureInfos.push(new StructureInfo(parseFloat(struct[1]),parseFloat(struct[2]),parseFloat(struct[3]),parseFloat(struct[4])) );
		//console.log(struct.join(','));
	}
	return StructureInfos;
}

//	var newCandidate = new Candidate( sequence , cataliticCoreStart, Id, coreType)

// Summarizes the sFold results into an array of candidates
// for a given cutsite.
ParseUtilities.ParseSFoldResults = function (directory, cutsiteID) {

    Log(" ******************* Begun parsing SFOLD results ******************* ", "ParseUtilities.ParseSFoldResults",0);
    if (directory == undefined)
        directory = '';
    else
        directory += FileSeparator;

    //Pattern is location\\ID\\structures\\10structure.out (and 10structure_2.out)
    //TODO: Find ID
    var file_pattern_begin = directory + cutsiteID + FileSeparator;
    var file_pattern_end = FileSeparator;//'\\structures\\';
    fs = require('fs');
    var Candidates = new Array();
    for (var struct_num = 0; struct_num < 200; struct_num++) 
    {

        console.log("Parsing " + cutsiteID + ':'+ struct_num + "th candidate ");

        var file_pattern = file_pattern_begin + (struct_num).toString() + file_pattern_end;
        var file = file_pattern + '10structure_2.out';
        var fileStructures = file_pattern + '10structure.out';

        if (!fs.existsSync(file)) 
        
        {
            Log("No more files for cutsite type " + cutsiteID + ", request " + directory, "ParseUtilities.ParseSFoldResults", 1);
            break; //ran out of files
        }

        var Structs = ParseUtilities.ParseStructuresSummary(file);
        ParseUtilities.ParseStructure(fileStructures, Structs);

        Candidates.push(Structs);

        //console.log("\n\nFile " + file_pattern + " parsed\n\n********************************");
    }
    return Candidates;
}
	
exports.ParseUtilities=ParseUtilities;
