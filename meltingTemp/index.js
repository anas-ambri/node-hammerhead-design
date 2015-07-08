var MeltingTCalc = require('./melting_t.js');
var MELTING_LOWERBOUND = 5 ; //That is 5 below temperature of environment
var MELTING_UPPERBOUND = 60 ; //That is 40 degrees above environment T


function MeltingTCalcRouter(str, prefs) {
    //if (prefs == null || prefs.naEnv == null)
    //    return tm_Basic(str);
    //else
    //    return tm_Salt_Adjusted(str, prefs.naEnv);//(Na + K) in mM
    var saltConc = 0;
    var meltingT = 0;
    if (prefs.naEnv == null && prefs.mgEnv == null)
        meltingT = MeltingTCalc.tm_Basic(str);
    else {
        if (prefs.naEnv != null)
            saltConc += prefs.naEnv;
        if (prefs.mgEnv != null)
            saltConc += prefs.mgEnv;

        meltingT = MeltingTCalc.tm_Salt_Adjusted(str, saltConc); //MUST BE IN mM
    }
    return meltingT;
}

function CleanseCandidates(rawCandidatesPerCutsite,prefs)
{
    var res = new Array();
    for (var ii = 0; ii < rawCandidatesPerCutsite.length; ++ii)
    {
        var cutsiteCandidates = rawCandidatesPerCutsite[ii];
        var cleansed = new Array();
        cleansed.BaseSequence = cutsiteCandidates.BaseSequence;
        cleansed.BaseCutindex = cutsiteCandidates.BaseCutindex;

        for (var jj = 0; jj < cutsiteCandidates.length ; ++jj)
        {
            var candidate = cutsiteCandidates[jj];
            //Remove non-annealing c (G in this case since it is reverse complemented candidate)
            //left and right arms are computed individually
            var seqToCompute = candidate.seq.substr(0, candidate.cut) ;
            var seqToCompute2 = candidate.seq.substr(candidate.cut + 1);
            var meltingT = MeltingTCalcRouter(seqToCompute, prefs);
            var meltingT2 = MeltingTCalcRouter(seqToCompute2, prefs);
            candidate.MeltingTemperature = meltingT + meltingT2;
            candidate.MeltingTemperatureLeft = meltingT;
            candidate.MeltingTemperatureRight = meltingT2;
            if (meltingT >= (prefs.tempEnv - MELTING_LOWERBOUND) && meltingT <= (prefs.tempEnv + MELTING_UPPERBOUND) &&
                meltingT2 >= (prefs.tempEnv - MELTING_LOWERBOUND) && meltingT2 <= (prefs.tempEnv + MELTING_UPPERBOUND))
                cleansed.push(candidate);
        }
        res.push(cleansed);
    }
    return res;
}



//exports.MeltingTCalc = MeltingTCalc;
exports.CleanseCandidates = CleanseCandidates;
exports.MeltingTCalcRouter = MeltingTCalcRouter;


