// We need this to build our post string
var querystring = require('querystring');
var http = require('http');
var fs = require('fs');
var Log = require('../log/').Log;



var TIMEOUT_BETWEEN_CHECKS = 5000; //NOTE: don't decrease this unless you want to be blacklisted by NCBI for abuse




//***************************************** NOTE *****************************************
//BLAST usage guidelines require > 3 seconds per query > 1 min to check on a query 
/**

*/
function InternalReportObject(ID,cutsiteID, reportObject)
{
    this.ID = ID;
    this.Parent = reportObject;
    this.cutsiteID = cutsiteID;
    this.blastRequestId = '';
}

function QueryBlastForRequest(reportObject) {
    var request = reportObject.Request;


    for (var ii = 0; ii < request.CutsiteTypesCandidateContainer.length; ++ii) {
        var primers = '';
        reportObject.AddToExecutionCount(1);
        var cutsiteType = request.CutsiteTypesCandidateContainer[ii];
        for (var jj = 0; jj < cutsiteType.Cutsites.length; ++jj) {
            primers += '>' + jj + '\n' + cutsiteType.Cutsites[jj].BaseSeq + '\n';
        }
        QueryBlast(primers, request.InVivoOrganism, new InternalReportObject(request.ID , cutsiteType.Cutsites[jj].ID, reportObject) );
    }
}


function QueryBlast(blastQueryPrimer, organism, reportObject) {

    Log("Sending job to BLAST for request " + reportObject.ID, "QueryBlast", 6);
    // Build the post string from an object
    var POST_PARAMS = querystring.stringify(
    {

        'QUERY': blastQueryPrimer,
        'EQ_MENU': organism,
        'db': 'nucleotide',
        'stype': 'nucleotide',
        'GENETIC_CODE': 1,
        'DBTYPE': 'gc',
        'DATABASE': 'refseq_rna',

        'BLAST_PROGRAMS': 'megaBlast',
        'DEFAULT_PROG': 'megaBlast',
        'CMD': 'Put',
        'PROGRAM': 'blastn',
        'FORMAT_TYPE': 'Text'
    }
);
    var POST_OPTIONS = {
        host: 'www.ncbi.nlm.nih.gov',
        port: '80',
        path: '/blast/Blast.cgi',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': POST_PARAMS.length
        }
    };




    // Set up the request
    var post_req =
        http.request(POST_OPTIONS,
        function QueryBlastOnResponse(res)
        {
            res.setEncoding('utf8');
            res.on('data',
                function QueryBlastDataReceived(chunk)//WARNING. this will be called more than one time with multiple chunks we have to put 
                //into a buffer until all chuncks are received
                {
                    Log("ResponseChunk Received for " +reportObject.ID, "QueryBlast", 12);

                    reportObject.blastRequestId += chunk;
                    if (chunk.indexOf('</html>') != -1)//once completed receiving chunks, find the request id
                    {
                        var final = reportObject.blastRequestId;
                        var begInd = final.indexOf('name="RID"');
                        var endInd = final.indexOf('>', begInd);
                        reportObject.blastRequestId = final.substr(begInd, endInd - begInd);
                        final = reportObject.blastRequestId;
                        
                        begInd = final.indexOf('value=');
                        if (begInd == -1)
                        {
                            reportObject.blastRequestId = 'ERROR: RID not returned!';
                            return;
                        }
                        endInd = final.indexOf('"', begInd + 7);
                        reportObject.blastRequestId = final.substr(begInd + 7, endInd - begInd - 7);//The 7 is the length of the 'value=' string + 1

                        if (reportObject.blastRequestId.length == 0) {
                            reportObject.blastRequestId = 'ERROR: RID not returned!';
                            return;
                        }
                        Log("Final RID received for " + reportObject.ID + ":" + reportObject.blastRequestId, "QueryBlast", 6);
                        setTimeout(CheckResults, 3000, [reportObject]);//BLAST usage guidelines require > 3 seconds per query > 1 min to check on a query 
                    }

                });

            res.on('error', function Error(e) {
                Log("Cannot connect to the blast server for: " + reportObject.ID , "CheckResults", -1);
                reportObject.chunk = 'ERROR:' + e.message;
                ParseBlastResults(reportObject);
            });
        });

    // post the data
    post_req.write(POST_PARAMS);
    post_req.end();

}



function CheckResults(args) {
    var reportObject = args[0];
    reportObject.chunk = '';
    Log("Checking for results for " + reportObject.ID + ":" + reportObject.blastRequestId, "CheckResults", 6);
    // Build the post string from an object
    var GET_PARAMS = querystring.stringify(
{
    'CMD': 'Get',
    'RID': reportObject.blastRequestId,
    'FORMAT_TYPE': 'Text'
}
);
    // An object of options to indicate where to post to
    var GET_OPTIONS = {
        host: 'www.ncbi.nlm.nih.gov',
        port: '80',
        path: '/blast/Blast.cgi',
        method: 'POST', 
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': GET_PARAMS.length
        }
    };

    // Set up the request
    var post_req = http.request(GET_OPTIONS, function (res) {
        res.setEncoding('utf8');
        res.on('data', function CheckResultsChunkReceived(chunk)
        {
            Log("Chunk received  for " + reportObject.ID + ":" + reportObject.blastRequestId, "CheckResults", 17);
            reportObject.chunk += chunk;
            
        });

        res.on('error', function Error()
            {
                Log("Cannot connect to the blast server for: " + reportObject.ID + ":" + reportObject.blastRequestId, "CheckResults", -1);
                reportObject.chunk = 'ERROR:' + e.message;
                ParseBlastResults(reportObject);
            });

        res.on('end', function CheckResultsAllReceived() {
            Log("All received  for " + reportObject.ID + ":" + reportObject.blastRequestId , "CheckResults", 6);
            var chunk = reportObject.chunk;
            var startInd = chunk.indexOf('QBlastInfoBegin');
            var endInd = chunk.indexOf('QBlastInfoEnd');
            chunk = chunk.substr(startInd+15, endInd - startInd - 15); //the size of QBlastInfoBegin

            if (chunk.indexOf("Status=WAITING") != -1) {
                reportObject.chunk = '';
                setTimeout(CheckResults, TIMEOUT_BETWEEN_CHECKS, [reportObject]);
                Log("Request not ready for "  + reportObject.ID + ":" + reportObject.blastRequestId+":"+chunk, "CheckResults", 10);
                console.log(chunk);
            }
            else {
                console.log(chunk);
                Log("Request ready for " + reportObject.ID + ":" + reportObject.blastRequestId + ":" + chunk, "CheckResults", 6);
                ParseBlastResults(reportObject);
            }
        });
    });

    // post the data
    post_req.write(GET_PARAMS);
    post_req.end();

}


function ParseBlastResults(reportObject)
{
    var chunk = reportObject.chunk;
    if (chunk.indexOf('ERROR') != -1) {
        reportObject.Parent.Request.UpdateState('Error communicating with BLAST database:' + chunk +'\n'+ 'Specificity cannot be evaluated for this instance');
        reportObject.Parent.FileCount = reportObject.Parent.FileCount - 1;
        reportObject.Parent.ExecuteIfComplete(8);
    }

    var queries = chunk.split('Query=');
    queries.splice(0, 1);
    for (var ii = 0; ii < queries.length; ++ii) {
        console.log('query ' + ii);
        var MatchArray = parseQueries(queries[ii]);
    }
    
}


function parseQueries(query, reportObject) {
    var matches = query.split('>');//('&gt;');
    console.log("Entered query with match number:" + matches.length);
    matches.splice(0, 1);
    var res = new Array();
    for (var ii = 0; ii < matches.length; ++ii) {
        var ref = matches[ii].substr(0, matches[ii].indexOf('|', matches[ii].indexOf('|') + 1));
        var begInd = matches[ii].indexOf('Identities') + 13;
        var percent = matches[ii].substr(begInd, matches[ii].indexOf(',', begInd) - begInd);
        begInd = matches[ii].indexOf('Sbjct') + 5;
        var subject = matches[ii].substr(begInd, matches[ii].indexOf('\n', begInd) - begInd);
        var subject = subject.split(' ')[4];
        res.push(ref + ';' + percent + ';' + subject + ';');
          console.log('ref=' + ref + ';' + 'Per=' + percent + ';' + 'subject=' + subject + ';');
    }
    return res;
}

    var obj = { 'blastRequestId': '', 'ID': 'TEST' };

    var obj2 = { 'blastRequestId': '', };
    //QueryBlast('>1\nGAAUAUCGUAGGUAAAAAUGCCUAUUGGAU\n>2\nCAAGACUAGGAAAAAAAUUUUCCAUGAAGCAA', 'mouse (taxid:10090)', obj);
    ////QueryBlast('GAAUAUCGUAGGUAAAAAUGCCUAUUGGAU', 'mouse (taxid:10090)', obj2);



    //var readline = require('readline');

    //var rl = readline.createInterface({
    //    input: process.stdin,
    //    output: process.stdout
    //});

    //rl.question('hello', function () { console.log(obj.blastRequestId); console.log(obj2.blastRequestId); fs.writeFile('hello.html', obj.chunk,function () { console.log('file written');}) });
    //rl.question('world', function () { console.log('end');});

    //exports.QueryBlastForRequest = QueryBlastForRequest;