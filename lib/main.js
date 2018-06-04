(function() {
  var classNames, colors, exp, i, len, name;

  colors = require("colors");

  global.logDebug = process.env.log_debug !== "0";

  global.logInfo = process.env.log_info !== "0";

  global.logWarn = process.env.log_warn !== "0";

  global.logError = process.env.log_error !== "0";

  global.debug = function(tag, msg, data) {
    if (global.logDebug === true) {
      return console.log(colors.gray(new Date().toISOString().substring(0, 16)), colors.blue('debug'), colors.gray(tag), msg);
    }
  };

  global.info = function(tag, msg) {
    if (global.logInfo === true) {
      return console.log(colors.gray(new Date().toISOString().substring(0, 16)), colors.green('info'), colors.gray(tag), msg);
    }
  };

  global.warn = function(tag, msg) {
    if (global.logWarn === true) {
      return console.log(colors.gray(new Date().toISOString().substring(0, 16)), colors.yellow('warning'), colors.gray(tag), msg);
    }
  };

  global.error = function(tag, msg) {
    if (global.logError === true) {
      return console.log(colors.gray(new Date().toISOString().substring(0, 16)), colors.red('error'), colors.gray(tag), msg);
    }
  };

  classNames = ['Controller', 'Imprint'];

  exp = function(name) {
    return exports[name] = require('./Service/' + name);
  };

  for (i = 0, len = classNames.length; i < len; i++) {
    name = classNames[i];
    exp(name);
  }

}).call(this);
