var start = process.hrtime();
var elapsed_time = function (note) {
    var precision = 3; // 3 decimal places
    var elapsed = process.hrtime(start)[1] / 1000000000; // divide by a billion to get nano to seconds
    var time = process.hrtime(start)[0] + " s, " + elapsed.toFixed(precision) + " ms - " + note;
    start = process.hrtime(); // reset the timer
    return time;
}

/*
    <summary>
     Replaces all instances of the regex find by the string replace
    </summary>
    <param name='find'>The regex to look for</param>
    <param name='replace'>The string to replace 'find' by</param>
    <return>The modified string</return>
*/
String.prototype.replaceAll = function(find,replace)
{
	return this.replace(new RegExp(find, 'g'), replace);
}

/*
    <summary>
     Complements the DNA or RNA string
    </summary>
    <param name='oligo'>The DNA/RNA string to complement</param>
    <param name='isRna'>(Optional) Whether it is RNA. Defaults to true</param>
    <return>The modified string</return>
*/
function Complement( oligo , isRna )
{
	if(isRna == undefined)
		isRna = true;
	var res = new Array();
	for(var ii = 0; ii < oligo.length; ++ii)
	{
		var c = oligo[ii];
		switch(c)
		{
			case 'G':
				res.push('C');
				break;
			case 'C':
				res.push('G');
				break;
			case 'A':
				if(isRna)
					res.push('U');
				else
					res.push('T');
				break;
			case 'U':
			case 'T':
				res.push('A');
					break;
			default:
				res.push(c);
		}
	}
	return res.join('');
}

/*
    <summary>
     Reverses a string
    </summary>
    <param name='oligo'>String to reverse</param>
    <param name='isRna'>(Optional) Whether it is RNA. Defaults to true</param>
    <return>The modified string</return>
*/
function Reverse( oligo )
{
	return oligo.split("").reverse().join("");
}


/*
    <summary>
     Reverse complements a RNA string
    </summary>
    <param name='oligo'>String to reverse complement</param>
    <return>The modified string</return>
*/
function ReverseComplement(oligo)
{
	return Complement(Reverse(oligo));
}


/*
    <summary>
     Finds the sequence length ignoring all whitespace and non-DNA/RNA characters
    </summary>
    <param name='oligo'>The string to find the number of base pairs</param>
    <return>The number of base pairs</return>
*/
function SequenceLength (oligo)
{
	var res = 0;
	for(var ii = 0; ii < oligo.length; ++ii)
	{
		var c = oligo[ii];
		switch(c)
		{
			case 'G':
				res +=1;
				break;
			case 'C':
				res +=1;
				break;
			case 'A':
				res +=1;
				break;
			case 'U':
			case 'T':
				res +=1;
				break;

		}
	}
	return res;
}

/*
    <summary>
     Transforms a sequence of RNA to DNA
    </summary>
    <param name='seq'>The sequence to change</param>
    <return>The changed string</return>
*/
function RnaToDna(seq)
{
	return seq.replaceAll('U','T');
}

/*
    <summary>
     Transforms a sequence of DNA to RNA
    </summary>
    <param name='seq'>The sequence to change</param>
    <return>The changed string</return>
*/
function DnaToRna(seq)
{
	return seq.replaceAll('T','U');
}

/*
    <summary>
     Takes a StructureInfo object and compresses the object { left: '', right:'', type ''}
     into a string "l,r,t"  , which reduces bandwidth and memory space.
    </summary>
    <param name='structureInfo'>The sequence to change</param>
    <return>The changed string</return>
*/
function CompressStructureInfo(structureInfo) {
    var struct = structureInfo;
    var pairs = struct.ConnectedPairs;
    var compressed = new Array();
    for (var mm = 0; mm < pairs.length; ++mm) {
        compressed.push(pairs[mm].left + ',' + pairs[mm].right + ',' + pairs[mm].type);
    }
    struct.ConnectedPairs = compressed;
}

/*
    <summary>
     Compresses an array of similar objects into a table that does no information repetition.
    </summary>
    <param name='arrayOfObjects'>The sequence to change</param>
    <param name='PropertiesToCompress'>The sequence to change</param>
    <return>Changes the array into a compressed version</return>
*/
function CompressObjectArrayIntoTable(arrayOfObjects, PropertiesToCompress) {
    var compressed = new Array();
    //First row is table key (column names)
    var compressedObj = new Array();
    for (var jj = 0; jj < PropertiesToCompress.length; ++jj) {
        compressedObj.push(PropertiesToCompress[jj]);
    }
    //Push Key
    compressed.push(compressedObj);


    for (var ii = 0; ii < arrayOfObjects.length; ++ii) {
        var candidate = arrayOfObjects[ii];
        compressedObj = new Array();
        for (var jj = 0; jj < PropertiesToCompress.length; ++jj) {
            compressedObj.push(candidate[PropertiesToCompress[jj]]);
        }
        compressed.push(compressedObj);
    }
    arrayOfObjects.length = 0;
    for (var ii = 0 ; ii < compressed.length; ++ii) {
        arrayOfObjects.push(compressed[ii]);
    }
}

/*
    <summary>
     Compresses an array of candidates according to their properties
    </summary>
    <param name='candidates'>The array of candidates to compress</param>
    <return>Changes the array into a compressed version</return>
*/

function CompressCandidates(candidates) {
    for (var ii = 0; ii < candidates.length ; ++ii) {
        var structuresFold = candidates[ii].StructuresSFold;
        CompressObjectArrayIntoTable(structuresFold, ["EnergyInterval", "Frequency", "LowestFreeEnergy", "ConnectedPairs", "Fitness"]);
    }
    CompressObjectArrayIntoTable(candidates, ["Sequence", "CataliticCoreStart", "ID", "StructuresSFold", "StructureUnaFold", "Fitness_Shape",  "Fitness_Target", "Fitness_Target_dG", "Fitness_Specificity", "CataliticCoreType", "cutSiteID", "cutSiteLocation", "requestID", "MeltingTemperature","MeltingTemperatureLeft","MeltingTemperatureRight", "LeftArmLength", "RightArmLength", "rank"]);
}


var deleteFolderRecursive = function (path) {
    var fs = require('fs');
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};


exports.SequenceLength = SequenceLength;
exports.ReverseComplement = ReverseComplement;
exports.Reverse = Reverse;
exports.Complement =  Complement;
exports.DnaToRna = DnaToRna;
exports.RnaToDna = RnaToDna;
exports.ElapsedTime = elapsed_time;
exports.CompressStructureInfo = CompressStructureInfo;
exports.CompressObjectArrayIntoTable = CompressObjectArrayIntoTable;
exports.CompressCandidates = CompressCandidates;
exports.DeleteFolderRecursive = deleteFolderRecursive;