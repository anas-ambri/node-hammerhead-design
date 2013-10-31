// We need this to build our post string
var querystring = require('querystring');
var http = require('http');
var fs = require('fs');
var Log = require('../log/').Log;


// An object of options to indicate where to post to
var GET_OPTIONS = {
    host: 'www.ncbi.nlm.nih.gov',
    port: '80',
    path: '/blast/Blast.cgi',
    method: 'GET',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': post_data.length
    }
};

var POST_OPTIONS = {
    host: 'www.ncbi.nlm.nih.gov',
    port: '80',
    path: '/blast/Blast.cgi',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': post_data.length
    }
};
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


var GET_PARAMS = querystring.stringify(
    {
        'CMD': 'Get',
        'RID': reportObject.blastRequestId,
        'FORMAT_TYPE': 'Text'
    }
);

//***************************************** NOTE *****************************************
//BLAST usage guidelines require > 3 seconds per query > 1 min to check on a query 
function QueryBlast(blastQueryPrimer, organism, reportObject) {

    Log("Sending job to BLAST for " + blastQueryPrimer + " request " + reportObject.Id, "QueryBlast", 6);
    // Build the post string from an object




    // Set up the request
    var post_req =
        http.request(post_options,
        function QueryBlastOnResponse(res)
        {
            res.setEncoding('utf8');
            res.on('data',
                function QueryBlastDataReceived(chunk)//WARNING. this will be called more than one time with multiple chunks we have to put 
                //into a buffer until all chuncks are received
                {
                    Log("ResponseChunk Received for" +reportObject.Id, "QueryBlast", 12);

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
                        Log("Final RID received for " + reportObject.Id + ":" + reportObject.blastRequestId, "QueryBlast", 6);
                        setTimeout(CheckResults, 3000, [reportObject]);//BLAST usage guidelines require > 3 seconds per query > 1 min to check on a query 
                    }

                });
        });

    // post the data
    post_req.write(post_data);
    post_req.end();

}


var obj = {'blastRequestId':'', 'Id' :'TEST'};

var obj2 = { 'blastRequestId': '', };
QueryBlast('GAAUAUCGUAGGUAAAAAUGCCUAUUGGAU', 'mouse (taxid:10090)', obj);
//QueryBlast('GAAUAUCGUAGGUAAAAAUGCCUAUUGGAU', 'mouse (taxid:10090)', obj2);


function CheckResults(args) {
    var reportObject = args[0];
    reportObject.chunk = '';
    Log("Checking for results for " + reportObject.Id + ":" + reportObject.blastRequestId, "CheckResults", 6);
    // Build the post string from an object


    // Set up the request
    var post_req = http.request(post_options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function CheckResultsChunkReceived(chunk)
        {
            Log("Chunk received  for " + reportObject.Id + ":" + reportObject.blastRequestId + ':' + chunk, "CheckResults", 6);
            reportObject.chunk += chunk;
        });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();

}

var readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('hello', function () { console.log(obj.blastRequestId); console.log(obj2.blastRequestId); fs.writeFile('hello.html', obj.chunk,function () { console.log('file written');}) });
rl.question('world', function () { console.log('end');});