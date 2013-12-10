var MeltingTCalcRouter = require('../meltingTemp/').MeltingTCalcRouter;




    var CATALITIC_CORES_STR =
    [
        'CUGAUGAGGCCGAAAGGCCGAA',
        'CUGAUGAGUCGCUGAAATGCGACGAA'
    ];


    var CATALITIC_CORES =
    [
        [
            { 'left': 0, 'right': -1, 'type': 'C' },//Not Connected
            { 'left': 1, 'right': -1, 'type': 'U' },
            { 'left': 2, 'right': -1, 'type': 'G' },
            { 'left': 3, 'right': -1, 'type': 'A' },
            { 'left': 4, 'right': -1, 'type': 'U' },
            { 'left': 5, 'right': -1, 'type': 'G' },
            { 'left': 6, 'right': -1, 'type': 'A' },//End not Connected
            { 'left': 7, 'right': 18, 'type': 'G' },//Connected
            { 'left': 8, 'right': 17, 'type': 'G' },
            { 'left': 9, 'right': 16, 'type': 'C' },
            { 'left': 10, 'right': 15, 'type': 'C' }, //End connected
            { 'left': 11, 'right': -1, 'type': 'G' }, //Not connected
            { 'left': 12, 'right': -1, 'type': 'A' },
            { 'left': 13, 'right': -1, 'type': 'A' },
            { 'left': 14, 'right': -1, 'type': 'A' }, //End not connected
            { 'left': 15, 'right': 10, 'type': 'G' }, //Connected
            { 'left': 16, 'right': 9, 'type': 'G' },
            { 'left': 17, 'right': 8, 'type': 'C' },
            { 'left': 18, 'right': 7, 'type': 'C' }, //End not connected
            { 'left': 19, 'right': -1, 'type': 'G' },//Connected
            { 'left': 20, 'right': -1, 'type': 'A' },
            { 'left': 21, 'right': -1, 'type': 'A' } //End not connected
        ],
        [
            { 'left': 0, 'right': -1, 'type': 'C' },//Not Connected
            { 'left': 1, 'right': -1, 'type': 'U' },
            { 'left': 2, 'right': -1, 'type': 'G' },
            { 'left': 3, 'right': -1, 'type': 'A' },
            { 'left': 4, 'right': -1, 'type': 'U' },
            { 'left': 5, 'right': -1, 'type': 'G' },
            { 'left': 6, 'right': -1, 'type': 'A' },//End not Connected
            { 'left': 7, 'right': 22, 'type': 'G' },//Connected
            { 'left': 8, 'right': 21, 'type': 'U' },
            { 'left': 9, 'right': 20, 'type': 'C' },
            { 'left': 10, 'right': 19, 'type': 'G' },
            { 'left': 11, 'right': 18, 'type': 'C' }, //End connected
            { 'left': 12, 'right': -1, 'type': 'U' }, //Not connected
            { 'left': 13, 'right': -1, 'type': 'G' },
            { 'left': 14, 'right': -1, 'type': 'A' },
            { 'left': 15, 'right': -1, 'type': 'A' },
            { 'left': 16, 'right': -1, 'type': 'A' }, //End not connected
            { 'left': 17, 'right': -1, 'type': 'U' },
            { 'left': 18, 'right': 11, 'type': 'G' }, //Connected
            { 'left': 19, 'right': 10, 'type': 'C' },
            { 'left': 20, 'right': 9, 'type': 'G' },
            { 'left': 21, 'right': 8, 'type': 'A' },
            { 'left': 22, 'right': 7, 'type': 'C' }, //End connected
            { 'left': 23, 'right': -1, 'type': 'G' },//Not Connected
            { 'left': 24, 'right': -1, 'type': 'A' },
            { 'left': 25, 'right': -1, 'type': 'A' } //End not connected
        ]
        
        
    ];
//Alternative normal type : CUGAUGAGUCCGUGAGGACGAA
    var SHORT_CATALITIC_CORES =
    [
        //Normal
        [
            {'left':0,'right':11,'type':'G'},
            {'left':1,'right':10,'type':'G'},
            {'left':2,'right':9,'type':'C'},
            {'left':3,'right':8,'type':'C'}, //End connected
            {'left':4,'right':-1,'type':'G'}, //Not connected
            {'left':5,'right':-1,'type':'A'},
            {'left':6,'right':-1,'type':'A'},
            {'left':7,'right':-1,'type':'A'}, //End not connected
            {'left':8,'right':3,'type':'G'}, //Connected
            {'left':9,'right':2,'type':'G'},
            {'left':10,'right':1,'type':'C'},
            {'left':11,'right':0,'type':'C'}
        ],
        [
            { 'left': 0, 'right': 15, 'type': 'G' },//Connected
            { 'left': 1, 'right': 14, 'type': 'U' },
            { 'left': 2, 'right': 13, 'type': 'C' },
            { 'left': 3, 'right': 12, 'type': 'G' },
            { 'left': 4, 'right': 11, 'type': 'C' }, //End connected
            { 'left': 5, 'right': -1, 'type': 'U' }, //Not connected
            { 'left': 6, 'right': -1, 'type': 'G' },
            { 'left': 7, 'right': -1, 'type': 'A' },
            { 'left': 8, 'right': -1, 'type': 'A' },
            { 'left': 9, 'right': -1, 'type': 'A' }, //End not connected
            { 'left': 10, 'right': -1, 'type': 'U' },
            { 'left': 11, 'right': 4, 'type': 'G' }, //Connected
            { 'left': 12, 'right': 3, 'type': 'C' },
            { 'left': 13, 'right': 2, 'type': 'G' },
            { 'left': 14, 'right': 1, 'type': 'A' },
            { 'left': 15, 'right': 0, 'type': 'C' } //End connected
        ]

    ];


    function Request ( targetSequence , accessionNumber, preferences , Id , coreTypeId, inVivoOrganism ,callback)
    {
        this.ID = Id;
        this.TargetSequence = targetSequence;
        this.AccessionNumber = accessionNumber == undefined? null : accessionNumber;
        this.Preferences = preferences;
        this.Completed = false;
        this.coreTypeId = coreTypeId;
        this.State = '\n';
        this.Callback = callback;
        this.ErrorContainer = new Array();
        this.InVivoOrganism = inVivoOrganism;
        this.Part = 0;
        this.PartProgress = 0;
        //Completed 1 => Candidate Generation
        //Completed 2 => Annealing
        //Completed 3 => Folding candidates
        //Completed 4 => Folding target
        if (this.Preferences != undefined && this.Preferences != null)
        {
            var temp = this.Preferences.tempEnv;
            if (temp != undefined && temp != null) {
                this.Preferences.tempEnv = temp + 273;//transform to abosolute (K)
            }
            else
                this.Preferences.tempEnv = 37 + 273;
        }
    }

    Request.prototype.UpdateState = function (state)
    {
        this.State += '\n' + state;
    }


    Request.prototype.ResetAndSignalProgress = function (newPart)
    {
	    var self = this;
	    self.Callback(self);
        this.Part = newPart;
        this.PartProgress = 0;
    }

    function CutsiteTypeCutsiteContainer(type)
    {
        this.Type = type;
        this.Cutsites = null;//array of cutsites
    }


    function Candidate(sequence, cataliticCoreStart, Id, coreType, requestID, cutsiteID, cutSiteLocation, meltingTemperature, leftLength, rightLength)
    {
        this.Sequence = sequence;
        this.CataliticCoreStart = cataliticCoreStart;
        this.ID = Id;
        this.StructuresSFold = new Array();
        this.StructureUnaFold = null;
        this.Fitness_Shape = 0;
        this.Fitness_Shape_dG = 0;
        this.Fitness_Target = 0;
        this.Fitness_Target_dG = 0;
        this.Fitness_Specificity = 0;
        this.Fitness_AnnealingT = 0;
        this.CataliticCoreType = coreType;
        this.cutSiteID = cutsiteID;
        this.cutSiteLocation = cutSiteLocation;
        this.requestID = requestID;
        this.MeltingTemperature = meltingTemperature;
        this.LeftArmLength = leftLength;
        this.RightArmLength = rightLength;
    }


    function StructureInfo (minEnergy,maxEnergy,freq,LowestFreeEnergy)
    {
        this.EnergyInterval = {'Min': minEnergy, 'Max' : maxEnergy};
        this.Frequency = freq;
        this.LowestFreeEnergy = LowestFreeEnergy;
        this.ConnectedPairs = new Array();
        this.Fitness = -1;
    }

    StructureInfo.prototype.toString = function ( )
    {
        var pairs = this.ConnectedPairs;
        var res = "Structure " + " freq:" + this.Frequency + ' LFE:' + this.LowestFreeEnergy + ' fitness:' + this.Fitness +'\n';
        for (var ii = 0; ii < pairs; ++ii)
        {
            res += '\t' + pairs[ii].type + ' pos:' + pairs[ii].left + ' connected to:' + (pairs.right == -1? 'nothing' :  pairs.right);
        }
        return res;
    }


    StructureInfo.prototype.AddPair = function ( left, right, type)
    {
        this.ConnectedPairs.push({'left':left,'right':right,'type':type});
    }

    StructureInfo.prototype.Evaluate = function (cataliticCoreStartNode, catCoreType, prefs)
    {
        if (prefs == undefined)
            prefs = null;
        //Find first pair of catalitic core
        var pairs = this.ConnectedPairs;
        this.Fitness = 0;
	
        this._evaluateCataliticCore(cataliticCoreStartNode,catCoreType);

        //Exclude catalitic core pairs and non-conecting pairs
        var excludedPairs = this._getPairsNotInCataliticCore(cataliticCoreStartNode,catCoreType);
	
        var MeltOfContiniousPairs = new Array(); //Just for debug of individual melt Ts
	
        for(var ii = 0; ii < excludedPairs.length ; ++ii)
        {
            var ContPair = ""; ContPair += excludedPairs[ii].type;
            var bump = false;
            var jj = ii + 1;
            for(; jj < excludedPairs.length ; ++jj)
            {
                if(excludedPairs[ii].left + 1 == excludedPairs[jj].left ||  excludedPairs[ii].left + 2 == excludedPairs[jj].left)
                {	
                    ContPair += excludedPairs[jj].type;
                    ii += 1;
                }
                else //Continuity broken
                {
                    ii = jj - 1; //Pre-see increment
                    break;
                }
            }
		
            var tMelt = MeltingTCalcRouter(ContPair, prefs);

            //console.log(ContPair + " m: " + tMelt);
            MeltOfContiniousPairs.push(tMelt);
            this.Fitness += tMelt;
        }
        //console.log("Fitness:" + this.Fitness);
	
	
    }

    //Returns a list with only non-catalitic core pairs that are linked
    StructureInfo.prototype._getPairsNotInCataliticCore = function(cataliticCoreStartNode,catCoreType)
    {
        var catCoreStruct = CATALITIC_CORES[catCoreType];
        var res  = new Array(); //ExcludedPairs means pairs that are NOT cat Pairs
        var pairs = this.ConnectedPairs;
        var coreIndex = 0;
        for(var ii = 0;ii < pairs.length;++ii)// 
        {
            var isCatCorePair = false
            for(var jj = 0; jj < catCoreStruct.length; ++jj)
            {
                if(pairs[ii].left == catCoreStruct[jj].left + cataliticCoreStartNode && pairs[ii].right == (catCoreStruct[jj].right == -1 ? -1 :(catCoreStruct[jj].right + cataliticCoreStartNode )))
                {
                    isCatCorePair = true;
                    break;
                }
            }
            // console.log('\tPair ' + pairs[ii].left  + ',' + pairs[ii].right  + ' is ' + isCatCorePair + ' cat core pair');
            var isTruePair = pairs[ii].right != -1;
            if(!isCatCorePair && isTruePair)
                res.push(pairs[ii]);
		
        }
        return res;
    }


    StructureInfo.prototype._evaluateCataliticCore = function( catCoreStartNode,catCoreType )
    {
        //Find first pair of catalitic core
        var locOfCatPair = -1;
        var pairs = this.ConnectedPairs;
        var coreStruct = SHORT_CATALITIC_CORES[catCoreType];
        for(var ii = 0; ii < pairs.length; ++ii)
        {
            if(pairs[ii].left==catCoreStartNode)
            {locOfCatPair = ii;break;}
        }
        //check if entire core is there
        var pass = true;
        if(locOfCatPair != -1)
        {
            var coreIndex = 0;
            var pairIndex = locOfCatPair;
            while (coreIndex < coreStruct.length && pairIndex < pairs.length)
            {
                //console.log(pairs[pairIndex].type + ' matched with ' + coreStruct[coreIndex].type);
                if( pairs[pairIndex].right != (coreStruct[coreIndex].right == -1 ? -1 :(catCoreStartNode + coreStruct[coreIndex].right))
                || pairs[pairIndex].left != catCoreStartNode + coreStruct[coreIndex].left )				
                {
                    //console.log('The node '+ pairs[pairIndex].left + ' of the catalictic core node ' + coreIndex + ' is not properly connected. ');
                    //console.log('\t connecting to '+ pairs[pairIndex].right+', expected' + (coreStruct[coreIndex].right == -1 ? -1 :(catCoreStartNode + coreStruct[coreIndex].right)).toString() );
                    pass = false;
                    break;
                }

                coreIndex++;
                pairIndex++;

            }

		
        }
        else
        {
            //The first pair was missing
            pass = false;
            //console.log("Cat core G node missing");
        }
	
        if(!pass)
        {
            this.Fitness += 50;
        }
    }


    exports.Request = Request;
    exports.Candidate = Candidate;
    exports.StructureInfo = StructureInfo;
    exports.CATALITIC_CORES = CATALITIC_CORES;
    exports.CutsiteTypeCutsiteContainer = CutsiteTypeCutsiteContainer;
    exports.CATALITIC_CORES_STR = CATALITIC_CORES_STR;