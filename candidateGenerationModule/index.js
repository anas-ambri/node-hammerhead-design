var Utils = require('../AlgorithmUtilities.js');
var Log = require('./../log/').Log;
var ReverseComplement = Utils.ReverseComplement;
var DnaToRna = Utils.DnaToRna;


/*
    <summary>
    Finds all the substrings in the given sequence, returning the array of the locations in the
    sequence.
    </summary>
    <param name='seq'> The sequence to get the cutsites from </param>
    <param name='cutSiteType'> The cutsite type to find  </param>
    <return>An array with all the locations found in the sequence</return>
*/
function FindCutsites(seq, cutSiteType)
{
    Log("Finding cutsites type " + cutSiteType + " for seq " + seq, "FindCusites", 15);
	var loc = new Array();
	res = -1;
	do
	{
	    res = seq.indexOf(cutSiteType, res + 1);
		if(res !== -1)
			loc.push(res);
	}
	while (res !== -1);
	Log("Number of cutsites type " + cutSiteType + " found was " + loc.length, "FindCusites", 20);
  if( loc.length > 40 )
  {  
    Log("WARNING: Preventive measures are in effect as more than 40 cut-sites where found. Only first 10 will be kept")
    loc.splice(10);
  }   
	return loc;
}

/*
    <summary>
    Creates candidates of the sequence for a given array of cutsite locations. 
    These candidates are reverse complemented sections of the original sequence
    determined by the object options.
    </summary>
    <param name='seq'> The sequence to get the candidates from</param>
    <param name='cutSites'> An array of locations of the cutsites</param>
    <param name='options'> an object that defines the size of the arms, minimum and maximum</param>
    <return>A jagged array of candidates, the first array is the cutsite and the inner array are the subsequences</return>
*/
function CreateCandidates (seq, cutSites, options)
{
	var Candidates = new Array();
	//Per cutsite
	//Load params
	var lamin = options.left_arm_min;
	var ramin = options.right_arm_min;
	var lamax = options.left_arm_max;
	var ramax = options.right_arm_max;
	if (options.coreTypeId != undefined && options.coreTypeId == 1)
	{
        //If Wishbone, increment by five to accomodate the TAA chunk
	    ramin += 5;
	    ramax += 5;
	}
	Log("Creating candidates with options: left range: [" +lamin+","+lamax+"[, right range: ["+ramin+","+ramax+"["+'\nSequence is ' + seq,"CreateCandidates",5);
	for(var ii = 0 ; ii < cutSites.length;++ii)
	{
	    Log("Creating candidates for cutsite location " + cutSites[ii], "CreateCandidates", 10);
	    var firstCutsiteCands = new Array();
	    firstCutsiteCands.BaseSequence = ''; //Keep track of the longest base sequence for the given cutsite
		for(var jj = lamin; jj < lamax; ++jj) //jj is the index of G in GUC
		{
		    
			var start = cutSites[ii] - jj;
			Log("Candidate start position " + start ,"CreateCandidates", 15);

			if (start < 0)
				continue;
            for (var kk = ramin; kk < ramax; ++kk)
			{
				var end = cutSites[ii]+3+kk;
				
				var length = end - start;
				Log("Candidate end position " + end + ", length: " + length, "CreateCandidates", 20);
				if (end >= seq.length)
				    continue;
				else if (seq.substr(start, length).length > firstCutsiteCands.BaseSequence.length) //Sequences that are too small fail in BLAST
				{
				    firstCutsiteCands.BaseSequence = seq.substr(start, length);
				    firstCutsiteCands.BaseCutindex = jj + 2;
				}

				var candidateSequence = ReverseComplement(seq.substr(start,length));
				var candidateULocation = candidateSequence.length - (jj+2) - 1; //jj +2  is the index of C in GUC, this transforms it into the index of U in the reverse complement
				firstCutsiteCands.push({"seq" : candidateSequence, "cut":candidateULocation, "targetLocation" :cutSites[ii], 'left':kk,'right':jj});	
			}
		}
		
		Candidates.push(firstCutsiteCands);
	}

	return Candidates;
}



/*
    <summary>
    Appends a promoter to a jagged array of candidates, per cutsite
    </summary>
    <param name='candidates'> The jagged array of candidates</param>
    <param name='promoter'> The promoter</param>
    <param name='depth'>The amount of the promoter that can be re-used in the candidate (3 for T7)</param>
    <return>The candidates are modified to have the promoter</return>
*/
function AppendPromoter(candidates,promoter, depth)
{
	var promAdded =  DnaToRna ( ReverseComplement (promoter) );
	
	for(var cutSiteIndex = 0; cutSiteIndex < candidates.length; ++cutSiteIndex)
	{
		var currentCutsite = candidates[cutSiteIndex];
		for(var candIndex = 0; candIndex < currentCutsite.length ; ++candIndex)
		{
			var candidate = currentCutsite[candIndex].seq;
			var jj;
			for( jj = 0; jj < depth ;++jj)
			{
				var ii;
				var match = true;
				for( ii = 1 ; ii <= depth - jj; ++ii)
				{
					if( candidate[candidate.length - ii] != promAdded[ii-1] )
					{
						match = false;
						break;
					}
				}
				if(match)
				{
					break;
				}
			}
			var matchBegin = depth - jj;
			currentCutsite[candIndex].seq += promAdded.substr(matchBegin);
		}	
	}
}


/*
    <summary>
    Generates candidates for a given sequence and a given cutsite type
    </summary>
    <param name='seq'> The sequence to get the candidates from</param>
    <param name='cutSiteType'> The cutsite type to identify (GUC)</param>
    <param name='options'> an object that defines the size of the arms, minimum and maximum</param>
    <return>A jagged array of candidates, the first array is the cutsite and the inner array are the subsequences</return>
*/
function GenerateCandidates( sequence, cutSiteType, options )
{
	var csites = FindCutsites (sequence, cutSiteType);
	var candidates = CreateCandidates(sequence, csites, options);
	return candidates;
}


/*
    <summary>
    Appends a promoter to a jagged array of candidates, per cutsite, if the promoter is undefined or null, does nothing
    </summary>
    <param name='candidateArray'> The jagged array of candidates</param>
    <param name='promoter'> The promoter</param>
    <param name='promoterCompatRange'>The amount of the promoter that can be re-used in the candidate (3 for T7)</param>
    <return>The candidates are modified to have the promoter</return>
*/
function AppendPromoterToMany(candidateArray, promoter, promoterCompatRange)
{
    if (promoter != undefined && promoter != '')
    {
        AppendPromoter(candidateArray, promoter, promoterCompatRange);
    }
    return candidateArray;
}

/*
    <summary>
    Adds a core structure to a sequence, given its location
    </summary>
    <param name='sequence'> The raw candidate sequence to add the core to</param>
    <param name='location'> The location of the C (or X), that will be replaced by the core</param>
    <param name='CoreStructure'>The core structure ID</param>
    <return>The sequence modified to contain the core structure</return>
*/
function AddCore(sequence, location, CoreStructure, CoreStructureTypeId) {
    var coreStructString = '';
    for (var ii = 0; ii < CoreStructure.length; ++ii) {
        coreStructString += CoreStructure[ii].type;
    }
    sequence = sequence.substr(0, location) + coreStructString + sequence.substr(location + 1); //Kills non annealing c + adds core
    
    if (CoreStructureTypeId == 1) //Add wishbonde secondary ring
    {
        sequence = sequence.substr(0, location - 5) + "UAA" + sequence.substr(location - 5);
    }
    return sequence;
}

exports.GenerateCandidates = GenerateCandidates;
exports.AppendPromoterToMany = AppendPromoterToMany;
exports.AddCore = AddCore;
exports.FindCutsites = FindCutsites;
