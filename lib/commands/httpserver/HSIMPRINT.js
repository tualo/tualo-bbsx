(function() {
  var HSIMPRINT, HSMYSQL, Imprint,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  HSMYSQL = require('./HSMYSQL');

  Imprint = require('../../Service/Imprint');

  module.exports = HSIMPRINT = (function(superClass) {
    extend(HSIMPRINT, superClass);

    function HSIMPRINT() {
      HSIMPRINT.__super__.constructor.call(this);
      this.on('start', this.initImprint);
    }

    HSIMPRINT.prototype.initImprint = function() {
      console.log("HSIMPRINT", "initImprint", this.args);
      this.imprint = null;
      if (this.args.machine_ip !== '0') {
        this.imprint = new Imprint(this.args.machine_ip);
        this.imprint.on('imprint', this.onImprint.bind(this));
        return this.imprint.open();
      }
    };

    HSIMPRINT.prototype.onImprint = function(imprint) {
      var cp, fn, me, message, sql;
      imprint.job_id = this.currentJobID;
      this.lastimprint = imprint;
      this.lastimprinttime = (new Date()).getTime();
      message = imprint;
      this.jobCount += 1;
      me = this;
      sql = 'insert into bbs_data\n(\n  id,\n  kundennummer,\n  kostenstelle,\n  height,\n  length,\n  thickness,\n  weight,\n  inserttime,\n  job_id,\n  machine_no,\n  login,\n  waregroup,\n  addressfield\n) values (\n  {id},\n  {kundennummer},\n  {kostenstelle},\n  {height},\n  {length},\n  {thickness},\n  {weight},\n  now(),\n  {job_id},\n  {machine_no},\n  \'{login}\',\n  \'{waregroup}\',\n  \'{addressfield}\'\n)\non duplicate key update\n  kundennummer=values(kundennummer),\n  kostenstelle=values(kostenstelle),\n  height=values(height),\n  length=values(length),\n  thickness=values(thickness),\n  weight=values(weight),\n  inserttime=values(inserttime),\n  job_id=values(job_id),\n  machine_no=values(machine_no),\n  login=values(login),\n  waregroup=values(waregroup),\n  addressfield=values(addressfield)';
      cp = me.customerNumber.split('|');
      sql = sql.replace('{id}', message.machine_no * 100000000 + message.imprint_no);
      sql = sql.replace('{kundennummer}', cp[0]);
      sql = sql.replace('{kostenstelle}', cp[1]);
      sql = sql.replace('{height}', message.mail_height);
      sql = sql.replace('{length}', message.mail_length);
      sql = sql.replace('{thickness}', message.mail_thickness);
      sql = sql.replace('{weight}', message.mail_weight);
      sql = sql.replace('{job_id}', message.job_id);
      sql = sql.replace('{machine_no}', message.machine_no);
      sql = sql.replace('{waregroup}', me.waregroup);
      sql = sql.replace('{addressfield}', me.addressfield);
      sql = sql.replace('{login}', 'sorter');
      fn = function(err, connection) {
        var closeFN, doneFN, errorFN;
        me.lastSQLError = null;
        if (err) {
          if (process.env.DEBUG_BBS_HTTPSERVER === '1') {
            console.log('ERROR on MYSQL Connection');
          }
          console.trace(err);
          me.lastSQLError = err.message;
          errorFN = (function(_this) {
            return function(errMessage) {
              if (process.env.DEBUG_BBS_HTTPSERVER === '1') {
                return console.log('stopJob', 'errorFN', errMessage);
              }
            };
          })(this);
          closeFN = (function(_this) {
            return function(message) {
              me.currentJob('');
              if (process.env.DEBUG_BBS_HTTPSERVER === '1') {
                return console.log('stopJob', 'closeFN', 'on MYSQL Connection');
              }
            };
          })(this);
          doneFN = (function(_this) {
            return function(message) {
              me.currentJob('');
              if (process.env.DEBUG_BBS_HTTPSERVER === '1') {
                return console.log('stopJob', 'doneFN', 'on MYSQL Connection');
              }
            };
          })(this);
          return me.controller('getStopPrintjob', closeFN, doneFN, errorFN);
        } else {
          if (process.env.DEBUG_BBS_HTTPSERVER === '1') {
            console.log('write db');
          }
          return connection.query(sql, function(err, rows, fields) {
            me.lastSQLError = null;
            if (process.env.DEBUG_BBS_HTTPSERVER === '1') {
              console.log('write db returned');
            }
            if (err) {
              me.lastSQLError = err.message;
              if (process.env.DEBUG_BBS_HTTPSERVER === '1') {
                console.trace(err);
              }
              if (err.code !== 'ER_DUP_KEY') {
                errorFN = (function(_this) {
                  return function(errMessage) {
                    if (process.env.DEBUG_BBS_HTTPSERVER === '1') {
                      return console.log('stopJob', 'errorFN', errMessage);
                    }
                  };
                })(this);
                closeFN = (function(_this) {
                  return function(message) {
                    me.currentJob('');
                    if (process.env.DEBUG_BBS_HTTPSERVER === '1') {
                      return console.log('stopJob', 'closeFN', 'db write error');
                    }
                  };
                })(this);
                doneFN = (function(_this) {
                  return function(message) {
                    me.currentJob('');
                    if (process.env.DEBUG_BBS_HTTPSERVER === '1') {
                      return console.log('stopJob', 'doneFN', 'db write error');
                    }
                  };
                })(this);
                me.controller('getStopPrintjob', closeFN, doneFN, errorFN);
              }
            }
            return connection.release();
          });
        }
      };
      me.pool.getConnection(fn);
      if (process.env.DEBUG_BBS_HTTPSERVER === '1') {
        return console.log('imprint--------------', imprint);
      }
    };

    return HSIMPRINT;

  })(HSMYSQL);

}).call(this);
