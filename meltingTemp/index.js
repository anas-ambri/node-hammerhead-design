var MeltingTCalc = require('./melting_t.js');
var MELTING_LOWERBOUND = 5 ; //That is 5 degrees below environment T
var MELTING_UPPERBOUND = 20 ; //That is 5 degrees below environment T

function CleanseCandidates(rawCandidatesPerCutsite,prefs)
{
    var res = new Array();
    for (var ii = 0; ii < rawCandidatesPerCutsite.length; ++ii)
    {
        var cutsiteCandidates = rawCandidatesPerCutsite[ii];
        var cleansed = new Array();
        for (var jj = 0; jj < cutsiteCandidates.length ; ++jj)
        {
            var candidate = cutsiteCandidates[jj];
            //Remove non-annealing c (G in this case since it is reverse complemented candidate)
            var seqToCompute = candidate.seq.substr(0, candidate.cut) + candidate.seq.substr(candidate.cut + 1);
            var saltConc = 0;
            var meltingT = null;
            if (prefs.naEnv == null && prefs.mgEnv == null)
                meltingT = MeltingTCalc.tm_Basic(seqToCompute);
            else {
                if (prefs.naEnv != null)
                    saltConc += prefs.naEnv;
                if (prefs.mgEnv != null)
                    saltConc += prefs.mgEnv;
                meltingT = MeltingTCalc.tm_Salt_Adjusted(seqToCompute, prefs.naEnv + prefs.mgEnv); //MUST BE IN mM
            }
            candidate.MeltingTemperature = meltingT;
            if (meltingT >= (prefs.tempEnv - MELTING_LOWERBOUND) && meltingT <= (prefs.tempEnv + MELTING_UPPERBOUND))
                cleansed.push(candidate);
        }
        res.push(cleansed);
    }
    return res;
}
exports.MeltingTCalc = MeltingTCalc;
exports.CleanseCandidates = CleanseCandidates;


