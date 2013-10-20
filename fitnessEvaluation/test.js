
//Temp test for pareto front
/*

10|
9 |
8 |      x(0)
7 |
6 |x(2)  x(1) x(0)
5 |
4 |               x(0)
3 |   x(2)  x(1)  
2 |
1 |x  x(3)  x(2)     x(1)  x(0)
0 ______________________________________
   1  2  3  4  5  6  7  8  9  10 



*/

var testDataSet =
    [
        { 'effective': 1, 'efficient': 1 },
        { 'effective': 1, 'efficient': 6 },
        { 'effective': 2, 'efficient': 3 },
        { 'effective': 2, 'efficient': 1 },
        { 'effective': 3, 'efficient': 6 },
        { 'effective': 3, 'efficient': 8 },
        { 'effective': 4, 'efficient': 1 },
        { 'effective': 4, 'efficient': 3 },
        { 'effective': 5, 'efficient': 6 },
        { 'effective': 6, 'efficient': 4 },
        { 'effective': 7, 'efficient': 1 },
        { 'effective': 7, 'efficient': 1 },
        { 'effective': 9, 'efficient': 1 }

    ];

ParetoFrontRank(testDataSet, ["effective", "efficient"], [true, true], 0);
for (var xx = 0 ; xx < testDataSet.length; ++xx) {
    console.log("Point (" + testDataSet[xx].effective + ',' + testDataSet[xx].efficient + ') has rank ' + testDataSet[xx].rank);
}
