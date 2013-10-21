var SHOW_ALL = 30;
var HIDE_ALL = 0;

var config = require('../config/config.json');
var LOG_LEVEL = config.log_level;  // 0: Only super important stuff
                                   // 30: Everything

if(process.env.NODE_ENV === 'test'){
    LOG_LEVEL = SHOW_ALL;
}
                                        
function Log(message, module, level)
{
    if(level < LOG_LEVEL)
            console.log(module+": "+ message);
}

function setLogLevel(newLevel)
{
    LOG_LEVEL = newLevel;
};

exports.Log = Log;
exports.setLogLevel = setLogLevel;
exports.HIDE_ALL = HIDE_ALL;
exports.SHOW_ALL = SHOW_ALL;
