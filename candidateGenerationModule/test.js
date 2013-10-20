var TestObj = require( './index.js');
var Utils = require('../AlgorithmUtilities.js');
var Model = require('../model/');
var RnaToDna = Utils.RnaToDna;

function ShowCandidates(cands, dna)
{
	if(dna == undefined)
		dna = false;
	var res = "";
	var consRes = "";
	for(var ii = 0; ii < cands.length; ++ii)
	{
		res += "<p>Cut site number " + ii + "</p>";
		consRes += "Cut site number " + ii + "\n";
		for(var jj = 0; jj < cands[ii].length; ++jj)
		{
			var currentSeq = cands[ii][jj].seq;

			var c_pos = cands[ii][jj].cut;
			//currentSeq = currentSeq.substr(0,c_pos)+currentSeq.substr(c_pos+1);//REMOVE non-annealing C from comupation

			var computationalResult = 0;//tm_Base_Stacking(currentSeq.replaceAll('U','T'),GLOBAL_PARAMETERS.oligomer_mM,GLOBAL_PARAMETERS.salt_ion_mM,GLOBAL_PARAMETERS.Mg_ion_mM);
			res += "<p>\t" +( dna? RnaToDna(cands[ii][jj].seq): cands[ii][jj].seq )+ "\tcutsite pos:"+ c_pos+'</p>';
			consRes += "\t" + (dna ? RnaToDna(cands[ii][jj].seq) : cands[ii][jj].seq) + "\tcutsite pos:" + c_pos + '\n';
		}
	}
	console.log(consRes)
	//$('.displayUpdate').html(res);
}

function Verify(arr1, arr2, verificationName)
{
    if (arr1.length != arr2.length)
        console.log("FAILURE: Asserition failed for " + verificationName + ". Lenght is not the same!");

    for (var ii = 0 ; ii < arr1.length && ii < arr2.length ; ++ii)
    {
        var inner1 = arr1[ii];
        var inner2 = arr2[ii];
        if (inner1.length != inner2.length)
            console.log("FAILURE: Asserition failed for " + verificationName + ". Lenght is not the same for inner arrays " + ii);

        for (var jj = 0 ; jj < inner1.length && jj < inner2.length ; ++jj)
        {
            var val1 = inner1[jj];
            var val2 = inner2[jj];
            if (val1.seq == val2)
            {
                console.log("PASS: for " + verificationName + ". " + ii + ',' + jj);
            }
            else
            {
                console.log("FAILURE: Asserition failed for " + verificationName + ". Values are not the same for " + ii + ',' + jj);
            }
        }

    }
}

var genSeqsNormal= 
TestObj.GenerateCandidates ('GUACGUAUGCAUCGACUAGUCAGCAGAUCGUACUGAUGCUAGCUAGCUAGCUAGAGAUGAGUACGCCGAGAGUAGGUCGUGCUAGCGCGCGAGAGAGU',
							'GUC', 
							{
								'left_arm_min' : 2 ,
								'right_arm_min' : 2,
								'left_arm_max' : 5,
								'right_arm_max' : 5,
								'promoter' : ''
							}
							);


var genSeqs= 
TestObj.GenerateCandidates ('GUACGUAUGCAUCGACUAGUCAGCAGAUCGUACUGAUGCUAGCUAGCUAGCUAGAGAUGAGUACGCCGAGAGUAGGUCGUGCUAGCGCGCGAGAGAGU',
							'GUC', 
							{
								'left_arm_min' : 2 ,
								'right_arm_min' : 2,
								'left_arm_max' : 5,
								'right_arm_max' : 5,
								'promoter' : 'TAATACGACTCACTATAGGG'
							}
							);
genSeqs = TestObj.AppendPromoterToMany(genSeqs, 'TAATACGACTCACTATAGGG', 3);

var fromPaper= 
TestObj.GenerateCandidates ('CUACAGAGUGUCAUCUUAUUU',
							'GUC', 
							{
								'left_arm_min' : 2 ,
								'right_arm_min' : 2,
								'left_arm_max' : 5,
								'right_arm_max' : 5,
								'promoter' : ''
							}
							);
							
							
console.log("Original Sequence: " + 'GUACGUAUGCAUCGACUAGUCAGCAGAUCGUACUGAUGCUAGCUAGCUAGCUAGAGAUGAGUACGCCGAGAGUAGGUCGUGCUAGCGCGCGAGAGAGU');						
ShowCandidates(genSeqsNormal);		
					
console.log("Original Sequence: " + 'GUACGUAUGCAUCGACUAGUCAGCAGAUCGUACUGAUGCUAGCUAGCUAGCUAGAGAUGAGUACGCCGAGAGUAGGUCGUGCUAGCGCGCGAGAGAGU');						
ShowCandidates(genSeqs);


console.log("Original Sequence: " + 'CUACAGAGUGUCAUCUUAUUU');						
ShowCandidates(fromPaper,false);

var coreAdded = new Array();
for (var ii = 0 ; ii < genSeqs.length; ++ii)
{
    var tempArr = new Array();
    console.log("Cutsite #"+ii);
    var cutsite = genSeqs[ii];
    for (var jj = 0 ; jj < cutsite.length; ++jj)
    {
        var cand = cutsite[jj];
        console.log('candidate without core: \t' + cand.seq);

        var completeSeq =  TestObj.AddCore(cand.seq, cand.cut, Model.DomainObjects.CATALITIC_CORES[0]);
        var obj = new Object();
        obj.seq = completeSeq;
        tempArr.push(obj);
        console.log('candidate with    core: \t' + completeSeq);
    }
    coreAdded.push(tempArr);
}

var genSeqsNormalResults =
    [
        ['CUGACUA',
        'GCUGACUA',
        'UGCUGACUA',
        'CUGACUAG',
        'GCUGACUAG',
        'UGCUGACUAG',
        'CUGACUAGU',
        'GCUGACUAGU',
        'UGCUGACUAGU'
        ],
        [
        'ACGACCU',
        'CACGACCU',
        'GCACGACCU',
        'ACGACCUA',
        'CACGACCUA',
        'GCACGACCUA',
        'ACGACCUAC',
        'CACGACCUAC',
        'GCACGACCUAC'
        ]
    ];

var genSeqsResults =
[
    [
    'CUGACUACCCUAUAGUGAGUCGUAUUA',
    'GCUGACUACCCUAUAGUGAGUCGUAUUA',
    'UGCUGACUACCCUAUAGUGAGUCGUAUUA',
    'CUGACUAGCCCUAUAGUGAGUCGUAUUA',
    'GCUGACUAGCCCUAUAGUGAGUCGUAUUA',
    'UGCUGACUAGCCCUAUAGUGAGUCGUAUUA',
    'CUGACUAGUCCCUAUAGUGAGUCGUAUUA',
    'GCUGACUAGUCCCUAUAGUGAGUCGUAUUA',
    'UGCUGACUAGUCCCUAUAGUGAGUCGUAUUA'
    ],
    [
    'ACGACCUCCCUAUAGUGAGUCGUAUUA',
    'CACGACCUCCCUAUAGUGAGUCGUAUUA',
    'GCACGACCUCCCUAUAGUGAGUCGUAUUA',
    'ACGACCUACCCUAUAGUGAGUCGUAUUA',
    'CACGACCUACCCUAUAGUGAGUCGUAUUA',
    'GCACGACCUACCCUAUAGUGAGUCGUAUUA',
    'ACGACCUACCCUAUAGUGAGUCGUAUUA',
    'CACGACCUACCCUAUAGUGAGUCGUAUUA',
    'GCACGACCUACCCUAUAGUGAGUCGUAUUA'
    ]
];

var paperResult =
    [
        [
            'AUGACAC',
            'GAUGACAC',
            'AGAUGACAC',
            'AUGACACU',
            'GAUGACACU',
            'AGAUGACACU',
            'AUGACACUC',
            'GAUGACACUC',
            'AGAUGACACUC'
        ]
    ];


var CoreAddedResults =
[
    [
    'CUCUGAUGAGUCCGUGAGGACGAAACUACCCUAUAGUGAGUCGUAUUA',
    'GCUCUGAUGAGUCCGUGAGGACGAAACUACCCUAUAGUGAGUCGUAUUA',
    'UGCUCUGAUGAGUCCGUGAGGACGAAACUACCCUAUAGUGAGUCGUAUUA',
    'CUCUGAUGAGUCCGUGAGGACGAAACUAGCCCUAUAGUGAGUCGUAUUA',
    'GCUCUGAUGAGUCCGUGAGGACGAAACUAGCCCUAUAGUGAGUCGUAUUA',
    'UGCUCUGAUGAGUCCGUGAGGACGAAACUAGCCCUAUAGUGAGUCGUAUUA',
    'CUCUGAUGAGUCCGUGAGGACGAAACUAGUCCCUAUAGUGAGUCGUAUUA',
    'GCUCUGAUGAGUCCGUGAGGACGAAACUAGUCCCUAUAGUGAGUCGUAUUA',
    'UGCUCUGAUGAGUCCGUGAGGACGAAACUAGUCCCUAUAGUGAGUCGUAUUA'
    ],
    [
    'ACCUGAUGAGUCCGUGAGGACGAAACCUCCCUAUAGUGAGUCGUAUUA',
    'CACCUGAUGAGUCCGUGAGGACGAAACCUCCCUAUAGUGAGUCGUAUUA',
    'GCACCUGAUGAGUCCGUGAGGACGAAACCUCCCUAUAGUGAGUCGUAUUA',
    'ACCUGAUGAGUCCGUGAGGACGAAACCUACCCUAUAGUGAGUCGUAUUA',
    'CACCUGAUGAGUCCGUGAGGACGAAACCUACCCUAUAGUGAGUCGUAUUA',
    'GCACCUGAUGAGUCCGUGAGGACGAAACCUACCCUAUAGUGAGUCGUAUUA',
    'ACCUGAUGAGUCCGUGAGGACGAAACCUACCCUAUAGUGAGUCGUAUUA',
    'CACCUGAUGAGUCCGUGAGGACGAAACCUACCCUAUAGUGAGUCGUAUUA',
    'GCACCUGAUGAGUCCGUGAGGACGAAACCUACCCUAUAGUGAGUCGUAUUA'
    ]
];
console.log("Verification...");
Verify(genSeqsNormal, genSeqsNormalResults, '"Sequences"');
Verify(genSeqs, genSeqsResults, '"Sequences with promoter"');
Verify(coreAdded, CoreAddedResults, '"Sequences with core"');
console.log("Verification Complete");