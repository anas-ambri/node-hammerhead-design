console.log(" ********************** Testing sfold execution ********************** ");
var TestObj = require( './index.js');
var ParseUtilities = TestObj.Parsing.ParseUtilities;
var ReportObject = function ReportObject(request) {
    this.Request = request;
    this.FileCount = 0;
}


TestObj.Folding.Fold.FoldCandidates ( {'ID' : 'cutSite'+0, 'requestID':'test'}, ['UUA CUG GAA CUG AUG AGU CCG UGA GGA CGA A AC AUC UGG AGA'], new ReportObject()  ); 
console.log('ex');


console.log(" ********************** Read sfold execution ********************** ");

	var Candidates = ParseUtilities.ParseSFoldResults();
	
	
	var readline = require('readline');

	var rl = readline.createInterface({
	  input: process.stdin,
	  output: process.stdout
	});

	var end = false;
	var CatCoreStart =  17;//SHORT cat core start.
Ask();
function Ask()
{
	console.log("*********************************\n\n");
	rl.question("Information for candidate,structure: ", 
	function(answer) 
	{
		var splited = answer.split(',');
		var ans = parseInt(splited[1]);
		var cand = parseInt(splited[0]);
		if(ans == -1 || isNaN(cand))
			end = true;
		
		if(end)
		{
			rl.close();
			console.log('exiting...'); 
		}
		else
		{
			console.log("*********************************\n\n");
			console.log("Candidate " + cand);
			if(!isNaN(ans))
			{
				console.log("Structure " + ans + ':');
				var s = Candidates[cand][ans]
				console.log("Frequency:" + s.Frequency);
				console.log("Connections");
				var cg = 0;
				var au = 0;
				for(var ii = 0; ii < s.ConnectedPairs.length;++ii)
				{
					console.log(s.ConnectedPairs[ii]);
					var t = s.ConnectedPairs[ii].type ;
					if(t == 'C' || t == 'G')
						cg++;
					else
						au++;
				}
				cg = cg/2;
				au = au/2;
				console.log("GC total connections: " + cg);
				console.log("AU total connections: " + au);
				console.log("*********************************\n\n");
			}
			else
			{
				if(cand != -1)
				{
					var ss = Candidates[cand];
					
					for(var ii = 0; ii < ss.length;++ii)
					{
						console.log("Struct "+ ii + " freq: " + ss[ii].Frequency); 
						ss[ii].Evaluate(/**/CatCoreStart,0);//Try normal core type
					}
					console.log("*********************************\n\n");
				}
				else
				{
					console.log("Fitness for all candidates:");
					for(var jj = 0; jj < Candidates.length;++jj)
					{
						console.log("\tCandidate :" + (jj).toString());
						var CandFitness = 0 ;
						console.log("	**********   ");
						var ss = Candidates[jj];
						
						for(var ii = 0; ii < ss.length;++ii)
						{
							console.log("Struct "+ ii + " freq: " + ss[ii].Frequency); 
							ss[ii].Evaluate(CatCoreStart,0);
							CandFitness += ss[ii].Fitness * ss[ii].Frequency;
						}
						
						
						ss.OverallFitness = CandFitness; //Dyn add property
						console.log("	**********   ");
						console.log("\tOverall = " +  CandFitness.toFixed(2));
						console.log("	**********   ");
					}
					console.log("*********************************\n\n");
					console.log("*********************************\n\n");
				}
			}
			setTimeout(Ask,100);
		}
	});
}
