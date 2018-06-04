(function() {
  var HSCTRL, HSMYSQL, mysql,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  HSCTRL = require('./HSCTRL');

  mysql = require('mysql');

  module.exports = HSMYSQL = (function(superClass) {
    extend(HSMYSQL, superClass);

    function HSMYSQL() {
      HSMYSQL.__super__.constructor.call(this);
      this.on('start', this.initMYSQL);
    }

    HSMYSQL.prototype.initMYSQL = function() {
      console.log("HSMYSQL", "initMYSQL");
      this.pool = mysql.createPool(this.mysqlOpts);
      return this.pool.on('error', (function(_this) {
        return function(err) {
          return _this.onDBError;
        };
      })(this));
    };

    HSMYSQL.prototype.onDBError = function(err) {
      if (process.env.DEBUG_BBS_HTTPSERVER === '1') {
        console.log('####################');
        console.log('onDBError');
        console.trace(err);
      }
      return setTimeout(process.exit, 5000);
    };

    return HSMYSQL;

  })(HSCTRL);

}).call(this);
