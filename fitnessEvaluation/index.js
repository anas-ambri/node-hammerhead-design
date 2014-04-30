var MeltingTemp = require('../meltingTemp/');

Array.prototype.RemoveAt = function (index) {
    this.splice(index, 1);
}

Array.prototype.RemoveAtMany = function (arrayOfIndexes) {
    arrayOfIndexes = arrayOfIndexes.sort(function (a, b) { return a - b; });//This ensures that the indexes are in order
    for (var ii = 0; ii < arrayOfIndexes.length; ++ii)
    {
        this.RemoveAt(arrayOfIndexes[ii]-ii);//The ii accounts for the index that was removed.
    }
}

/*
    <summary>
        Finds if elementLeft is the same as elementRight.
        e.g. elementLeft == elementRight within pareto context.
    </summary>
    <param name='elementLeft'>The element at the left of the operator</param>
    <param name='elementRight'>The element at the right of the operator</param>
    <param name='propertyArray'>The array of properties that will be pareto tested</param>
    <param name='tolerance'>value of tolerance</param>
    <return>True if equal, false otherwise</return>
*/
function _paretoEqual(elementLeft, elementRight, propertyArray, tolerance) {
    for (var ii = 0 ; ii < propertyArray.length; ++ii) {
        if (Math.abs(elementLeft[propertyArray[ii]] - elementRight[propertyArray[ii]]) > tolerance)
            return false;
    }
    return true;
}


/*
    <summary>
        Finds if elementLeft dominates elementRight.
        e.g. elementLeft > elementRight within pareto context.
    </summary>
    <param name='elementLeft'>The element at the left of the operator</param>
    <param name='elementRight'>The element at the right of the operator</param>
    <param name='propertyArray'>The array of properties that will be pareto tested</param>
    <param name='maximizeArray'>An array of the same size as propertyArray, identifying whether to maximize or minimize the property of matching index</param>
    <return>True if left dominates right, false otherwise</return>
*/
function _paretoGreaterThan(elementLeft, elementRight, propertyArray, maximizeArray)
{
    for (var ii = 0 ; ii < propertyArray.length; ++ii)
    {
        if (maximizeArray[ii])
        {
            if (elementLeft[propertyArray[ii]] < elementRight[propertyArray[ii]])
            {
                return false;
            }
        }
        else
        {
            if (elementLeft[propertyArray[ii]] > elementRight[propertyArray[ii]])
            {
                return false;
            }
        }
    }
    return true;
    
}


function ParetoFrontRank(array, propertyArray, maxMinArray, rank)
{
    //Shallow copy array
    var queueArray = array.slice();
    do {
        var frontIndexes = new Array();
        for (var ii = 0; ii < queueArray.length ; ++ii)
        {
            var testElement = queueArray[ii];
            var testElementDominated = false;
            //console.log("Is " + testElement.cutSiteID + ":" + testElement.ID + " dominateed?  " );
            for (var jj = 0; jj < queueArray.length; ++jj)
            {
                if (ii == jj) 
                    continue;//do not test an element against itself

                //an element is rank 0 if no one dominates him. Check if any element dominates him
                var dominated = _paretoGreaterThan(queueArray[jj], testElement, propertyArray, maxMinArray);
                    
                if (dominated) {
                    var equal = _paretoEqual(queueArray[jj], testElement, propertyArray, 0.01);
                    //an object dominates itself since it is no better at anything than itself. Identical objects must be caught
                    if (!equal) {
                        //console.log("\tYes by:"  + queueArray[jj].cutSiteID + ":" + queueArray[jj].ID );
                        testElementDominated = true;
                        break; ///BREAK GOES TO (1)
                    }
                }
                
            }// THIS IS (1)

            //Not dominated, so it belongs to pareto front
            if (!testElementDominated) {
                //console.log("Element " + testElement.cutSiteID + ":" + testElement.ID + " gets rank " +rank);
                testElement.rank = rank;
                frontIndexes.push(ii);
            }
        }
        //console.log("++++++++++++++++ RANK "+rank+"     ++++++++++++++++");
        //for (var xx = 0 ; xx < queueArray.length; ++xx) {
        //    console.log("Point (" + queueArray[xx].effective + ',' + queueArray[xx].efficient + ') has rank ' + queueArray[xx].rank);
        //}
        queueArray.RemoveAtMany(frontIndexes);

        // All front will have been computed. Repeat for next rank if the rank is not empty
        if (queueArray.length == 0) {
            return;
        }
        else {
            rank += 1;
        }
    } while (queueArray.length > 0);
}




/*
    <summary>
    Given a request object, goes through all candidates, and evaluates its
    pareto front rank
    </summary>
    <param name='sequence'>The request structure</param>
    <return>The request structure will be modified, the candidate will have its 'rank' attribute appropriately changed</return>
*/

function ParetoFrontForRequest(request)
{
    var allEle = new Array();
    for (var ii = 0; ii < request.CutsiteTypesCandidateContainer.length; ++ii)
    {
        var cutsiteType = request.CutsiteTypesCandidateContainer[ii];
        for (var jj = 0; jj < cutsiteType.Cutsites.length; ++jj)
        {
            var cutsite = cutsiteType.Cutsites[jj];
            var candidates = cutsite.Candidates;
            allEle.push.apply(allEle,candidates);
        }
    }
    ParetoFrontRank(allEle,
    ["Fitness_Shape", "Fitness_Target", "Fitness_Target_dG", "Fitness_Specificity", "MeltingTemperature"],
    [true,              true,               true,              false,                         true],
    0);
}

/*
    <summary>
    Given a request object, goes through all candidates, and evaluates the fitness of their structures.
    Finally, it does a weighted average of their structures based on how frequent the structure is likely to 
    occur
    </summary>
    <param name='sequence'>The request structure</param>
    <return>The request structure will be modified, the candidate will have its fitness appropriately changed</return>
*/
function CaculateCandidateFoldingFitness(request) {
    var cutsiteTypesLength = request.CutsiteTypesCandidateContainer.length;
    for (var ii = 0; ii < cutsiteTypesLength; ++ii) {
        var cutsiteTypeCutsiteContainer = request.CutsiteTypesCandidateContainer[ii].Cutsites;
        for (var jj = 0; jj < cutsiteTypeCutsiteContainer.length ; ++jj) {
            var cutsite = cutsiteTypeCutsiteContainer[jj];
            for (var kk = 0; kk < cutsite.Candidates.length ; ++kk) {
                var candidate = cutsite.Candidates[kk];
                var folds = candidate.StructuresSFold;
                var totalFitness = 0;
                for (var ll = 0; ll < folds.length; ++ll) {
                    folds[ll].Evaluate(candidate.CataliticCoreStart, candidate.CataliticCoreType, request.Preferences);
                    totalFitness += folds[ll].Fitness * folds[ll].Frequency;
                }
                candidate.Fitness_Shape = totalFitness;
            }
        }
    }
}

/*
    <summary>
    Given a StructureInfo object and a start and end index, finds all the continious sets of base-pairs,
    that is to say all base-pairs that are joined together
    </summary>
    <param name='structureInfo'>The StructureInfo object</param>
    <param name='start'>The start index to look for continous pairs</param>
    <param name='structureInfo'>The end index</param>
    <return>An array of substrins of the structure that is connnected</return>
*/
function _getContiniousPairsInRegion(structureInfo, start, end) {
    var result = new Array();
    var pairs = structureInfo.ConnectedPairs;
    for (var ii = start; ii < end && ii < pairs.length; ++ii) {
        var continiousSeq = '';
        for (var jj = ii; jj < pairs.length; ++jj) {
            if (pairs[jj].right != -1)
                continiousSeq += pairs[jj].type;
            else if (jj + 1 < pairs.length && pairs[jj + 1].right == -1) //the current and the next are not connected
            {
                if (continiousSeq.length != 0) {
                    result.push(continiousSeq);
                    ii = jj;
                    break;
                }
            }
            else if (jj + 1 < pairs.length && pairs[jj + 1].right != -1) //the current isnt connected, the next one is
            {
                continue;
            }
            else //its the end, and its not connected
            {
                if (continiousSeq.length != 0) {
                    result.push(continiousSeq);
                    ii = jj;
                    break;
                }
            }
        }
    }
    return result;
}

/*
    <summary>
     Given an array of StructureInfo of a target fold, and where the candidate would attatch (attach region),
     the Target fitness  (accesibility) will be computed based on how high the Melting temperature is
     on all continious pairs
    </summary>
    <param name='structureInfoArray'>The request strucure</param>
    <param name='leftArmLength'>The left arm length for the candidate</param>
    <param name='rightArmLength'>The right sarm length for the candidate</param>
    <param name='cutSiteLocation'>Where the candidate will land</param>
    <param name='saltConc'>salt concentration to evaluate melting temperature</param>
    <return>The fitness for the target, for the given region</return>
*/
function EvaluateTargetFoldsFitness(structureInfoArray, leftArmLength, rightArmLength, cutSiteLocation, prefs) {

    var totalFitness = 0;
    for (var ii = 0 ; ii < structureInfoArray.length; ++ii) {
        var continiousSeqArr = _getContiniousPairsInRegion(structureInfoArray[ii], cutSiteLocation - rightArmLength + 2 , cutSiteLocation +  leftArmLength + 3);
        var partialFitness = 0;
        //add the melting temperature of continious pairs
        for (var jj = 0; jj < continiousSeqArr.length; ++jj) {   
            partialFitness += MeltingTemp.MeltingTCalcRouter(continiousSeqArr[jj], prefs);
        }
        totalFitness += partialFitness * structureInfoArray[ii].Frequency;

    }
    return totalFitness;
}


/*
    <summary>
     Given a finalized request structure finds the fitnesses of the target, 
     the Free energy and the Melting temperature and adds them to the candidate accordingly
    </summary>
    <param name='sequence'>The request strucure</param>
    <return>The request structure will be modified, the candidate will have its fitness appropriately changed</return>
*/
function EvaluateFitnesses(request) {
    var NormalSFoldShapes = request.SFoldStructures;
    var cutsiteTypesLength = request.CutsiteTypesCandidateContainer.length;

    var Max_Target = Number.MIN_VALUE, Min_Target = Number.MAX_VALUE, Max_Shape = Number.MIN_VALUE, Min_Shape = Number.MAX_VALUE;
    var Max_dG = Number.MIN_VALUE, Min_dG = Number.MAX_VALUE;
    for (var ii = 0; ii < cutsiteTypesLength; ++ii) {
        var cutsiteTypeCutsiteContainer = request.CutsiteTypesCandidateContainer[ii].Cutsites;
        for (var jj = 0; jj < cutsiteTypeCutsiteContainer.length ; ++jj) {
            var cutsite = cutsiteTypeCutsiteContainer[jj];
            var ConstrainedSFoldStructures = cutsite.ConstrainedSFoldStructures;
            for (var kk = 0; kk < cutsite.Candidates.length ; ++kk) {
                var candidate = cutsite.Candidates[kk];
                //Check the cutsite region for annealing Temperature
                candidate.Fitness_Target = EvaluateTargetFoldsFitness(NormalSFoldShapes, candidate.LeftArmLength , candidate.RightArmLength + 2/*+ 2 accounts for UC*/, candidate.cutSiteLocation, request.Preferences);
                //This might be inverted. In the end, the closer it is to zero the better. It will always have one sign or the other.
                //if it has both, it would mean that it is easier to have a completely open cutsite than a normal cutsite.
                candidate.Fitness_Target_dG = Math.abs(  request.AverageLowestFreeEnergy - cutsite.AverageLowestFreeEnergy );
                candidate.MeltingTemperature = Math.round(100*(candidate.MeltingTemperature - 276))/100; //Reconvert to degrees
                
                candidate.MeltingTemperatureLeft = Math.round(100*(candidate.MeltingTemperatureLeft - 276))/100; //Reconvert to degrees
                candidate.MeltingTemperatureRight = Math.round(100*(candidate.MeltingTemperatureRight - 276))/100; //Reconvert to degrees
                
                
                candidate.Fitness_Specificity = Math.round(100*cutsite.SpecificityFitness)/100;
                //Find max and min values for normalization
                if (candidate.Fitness_Target > Max_Target)
                    Max_Target = candidate.Fitness_Target;
                if (candidate.Fitness_Target < Min_Target)
                    Min_Target = candidate.Fitness_Target;

                if (candidate.Fitness_Shape > Max_Shape)
                    Max_Shape = candidate.Fitness_Shape;
                if (candidate.Fitness_Shape < Min_Shape)
                    Min_Shape = candidate.Fitness_Shape;

                if (candidate.Fitness_Target_dG > Max_dG)
                    Max_dG = candidate.Fitness_Target_dG;
                if (candidate.Fitness_Target_dG < Min_dG)
                    Min_dG = candidate.Fitness_Target_dG;
            }
        }
    }
    // NORMALIZATION
    for (var ii = 0; ii < cutsiteTypesLength; ++ii) {
        var cutsiteTypeCutsiteContainer = request.CutsiteTypesCandidateContainer[ii].Cutsites;
        for (var jj = 0; jj < cutsiteTypeCutsiteContainer.length ; ++jj) {
            var cutsite = cutsiteTypeCutsiteContainer[jj];
            for (var kk = 0; kk < cutsite.Candidates.length ; ++kk) {
                //make 1.0 the best and 0.0 the worst. Currently bigger is worst
                var candidate = cutsite.Candidates[kk];
                candidate.Fitness_Target = 1 - (  (candidate.Fitness_Target - Min_Target) / (Max_Target - Min_Target )) ;
                candidate.Fitness_Shape = 1 - ( (candidate.Fitness_Shape - Min_Shape) / (Max_Shape - Min_Target))  ;
                candidate.Fitness_Target_dG = 1 - ( (candidate.Fitness_Target_dG - Min_dG) / (Max_dG-Min_dG)) ;
                //Round
                candidate.Fitness_Target = Math.round(1000 * candidate.Fitness_Target ) / 1000;
                candidate.Fitness_Shape = Math.round(1000 * candidate.Fitness_Shape  )/ 1000;
                candidate.Fitness_Target_dG = Math.round(1000 * candidate.Fitness_Target_dG ) / 1000;
            }
        }
    }
}


exports.EvaluateFitnesses = EvaluateFitnesses;
exports.CaculateCandidateFoldingFitness = CaculateCandidateFoldingFitness;
exports.ParetoFrontRank = ParetoFrontRank;
exports.ParetoFrontForRequest = ParetoFrontForRequest;

