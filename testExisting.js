console.log(" ********************** Testing Request Handle ********************** ");
var TestObj = require('./HandleRequest.js');
var MODEL = require('./model/');
var Request = MODEL.DomainObjects.Request;
var ReportObject = TestObj.ReportObject;

var fs = require('fs');

var d = fs.readFileSync('rqStateFrmoSever.txt');
var req = JSON.parse(d);

req.UpdateState = function (e) { console.log("STATE: " + e); }
req.Callback = function (e) { console.log("called"); }
var report = new ReportObject(req);
TestObj.HandleRequestPart8(report);

