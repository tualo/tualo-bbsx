(function() {
  var HSEXPRESS, P,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  P = require('./HSIMPRINT');

  module.exports = HSEXPRESS = (function(superClass) {
    extend(HSEXPRESS, superClass);

    function HSEXPRESS() {
      HSEXPRESS.__super__.constructor.call(this);
      this.on('start', this.initExpressServer);
    }

    HSEXPRESS.prototype.initExpressServer = function() {
      console.log("HSEXPRESS", "initExpressServer");
      return this.openExpressServer();
    };

    HSEXPRESS.prototype.openExpressServer = function() {
      var app, bodyParser, express;
      express = require('express');
      bodyParser = require('body-parser');
      app = express();
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({
        extended: true
      }));
      app.get('/', this.expressPlain.bind(this));
      app.get('/status', this.expressStatus.bind(this));
      app.all('/startjob', this.expressStartJob.bind(this));
      app.get('/stopjob', this.expressStopJob.bind(this));
      app.get('/restartimprint', this.expressRestartImprint.bind(this));
      app.all('/hotswitch', this.expressHotSwitch.bind(this));
      app.all('/reboot', this.expressReboot.bind(this));
      return app.listen(this.args.port, '0.0.0.0');
    };

    HSEXPRESS.prototype.expressPlain = function(req, res) {
      var result;
      result = {
        success: true
      };
      if (this.start_without_printing_running === true) {
        result.machine_ip = this.args.machine_ip;
        result.machine_port = this.args.machine_port;
        result.lastimprint = this.lastimprint;
        result.jobCount = this.jobCount;
        result.lastError = this.lastError;
        result.lastState = this.lastState;
        result.lastState.print_job_active = 1;
        result.lastSQLError = this.lastSQLError;
        result.lastStartJobMessage = this.lastStartJobMessage;
        res.send(JSON.stringify(result));
        return;
      }
      if (this.client.destroyed === true) {
        res.send(JSON.stringify({
          success: false,
          msg: "Keine Verbindung zur Maschine"
        }));
        return;
      }
      result.machine_ip = this.args.machine_ip;
      result.machine_port = this.args.machine_port;
      result.lastimprint = this.lastimprint;
      result.jobCount = this.jobCount;
      result.lastError = this.lastError;
      result.lastState = this.lastState;
      result.lastSQLError = this.lastSQLError;
      result.lastStartJobMessage = this.lastStartJobMessage;
      return res.send(JSON.stringify(result));
    };

    HSEXPRESS.prototype.expressRestartImprint = function(req, res) {
      var me;
      me = this;
      console.log('restartImprint', 'start');
      me.imprint.reopen();
      res.send(JSON.stringify({
        success: true,
        msg: 'imprint restarted'
      }));
      if (process.env.DEBUG_BBS_HTTPSERVER === '1') {
        return console.log('restartImprint', 'done');
      }
    };

    HSEXPRESS.prototype.expressReboot = function(req, res) {
      var fn, me;
      me = this;
      fn = function() {
        var rebootProc;
        return rebootProc = spawn('reboot', []);
      };
      res.send(JSON.stringify({
        success: true,
        msg: "rebooting"
      }));
      return setTimeout(fn.bind(me), 3000);
    };

    HSEXPRESS.prototype.expressStatus = function(req, res) {
      var me, message;
      me = this;
      if (me.hasMachine) {
        res.send(JSON.stringify({
          success: false,
          msg: "Keine Verbindung zur Maschine"
        }));
        return;
      }
      if (me.start_without_printing_running === true) {
        message = me.lastState;
        message.print_job_active = 1;
        message.print_job_id = 999999;
        if (process.env.DEBUG_BBS_HTTPSERVER === '1') {
          console.log('start_without_printing_running', 'status', message);
        }
        res.send(JSON.stringify({
          success: true,
          msg: message
        }));
        return;
      }
      return res.send(JSON.stringify({
        success: true,
        msg: me.lastState
      }));
    };

    HSEXPRESS.prototype.expressStopJob = function(req, res) {
      var me, message;
      me = this;
      message = {};
      if (me.start_without_printing_running === true) {
        this.currentJob('');
        this.setCustomerFile('');
        me.start_without_printing_running = false;
        res.send(JSON.stringify({
          success: true,
          msg: {}
        }));
        return;
      }
      return this.stopJob();
    };

    HSEXPRESS.prototype.expressHotSwitch = function(req, res) {
      var bodymessage, e, error, k, me, message, v;
      me = this;
      message = {};
      bodymessage = {};
      try {
        bodymessage = JSON.parse(req.body.message);
        if (process.env.DEBUG_BBS_HTTPSERVER === '1') {
          console.log('########################');
          console.log('########################');
          console.log(bodymessage);
          console.log('########################');
          console.log('########################');
        }
      } catch (error) {
        e = error;
        console.log(e);
      }
      message = {
        job_id: 1,
        weight_mode: 3,
        customerNumber: '69000|0',
        kundennummer: '69000',
        kostenstelle: 0,
        waregroup: 'Standardsendungen',
        label_offset: 0,
        date_offset: 0,
        stamp: 1,
        addressfield: 'L',
        print_date: 1,
        print_endorsement: 1,
        endorsement1: 'endors',
        endorsement2: 'endors',
        advert: '02042a3d422a7b9884329e0df9000000006a0000000000000000000000b93c00000000000000002102220100000000000000000000000000002c00000039004d00ffffffffffffffff0b0057657262756e672d3034001200f3fb07f3f12a03f6f3fbfff3fbfff3fb16f502072a3d422a7b9884c6a899bb00000000120000000000000000000000'
      };
      for (k in message) {
        v = message[k];
        if (bodymessage.hasOwnProperty(k)) {
          message[k] = bodymessage[k];
        }
      }
      me.lastStartJobMessage = message;
      me.currentJob(message.job_id);
      me.setCustomerFile(message.customerNumber);
      me.customerNumber = message.customerNumber;
      me.jobCount = 0;
      return res.send(JSON.stringify({
        success: true,
        msg: message
      }));
    };

    HSEXPRESS.prototype.expressStartJob = function(req, res) {
      var adv, bodymessage, e, endorsement1, endorsement2, error, error1, k, me, message, v;
      me = this;
      try {
        if (me.lastState.print_job_active === 1) {
          return res.send(JSON.stringify({
            success: false,
            msg: "Es wird bereits ein Druckauftrag ausgeführt"
          }));
        } else {
          bodymessage = {};
          try {
            bodymessage = JSON.parse(req.body.message);
            if (process.env.DEBUG_BBS_HTTPSERVER === '1') {
              console.log('########################');
              console.log('########################');
              console.log(bodymessage);
              console.log('########################');
              console.log('########################');
            }
          } catch (error) {
            e = error;
            console.log(e);
          }
          message = {
            job_id: 1,
            weight_mode: 3,
            customerNumber: '69000|0',
            kundennummer: '69000',
            kostenstelle: 0,
            waregroup: 'Standardsendungen',
            label_offset: 0,
            date_offset: 0,
            stamp: 1,
            addressfield: 'L',
            print_date: 1,
            print_endorsement: 1,
            endorsement1: 'endors',
            endorsement2: 'endors',
            advert: '02042a3d422a7b9884329e0df9000000006a0000000000000000000000b93c00000000000000002102220100000000000000000000000000002c00000039004d00ffffffffffffffff0b0057657262756e672d3034001200f3fb07f3f12a03f6f3fbfff3fbfff3fb16f502072a3d422a7b9884c6a899bb00000000120000000000000000000000'
          };
          if (bodymessage.hasOwnProperty('start_without_printing')) {
            if (bodymessage.start_without_printing * 1 === 1) {
              me.start_without_printing_running = true;
              me.currentJob(message.job_id);
              me.setCustomerFile(message.customerNumber);
              res.send(JSON.stringify({
                success: true,
                msg: 'Nur Transportieren kann einstellt werden.'
              }));
              return;
            }
          }
          for (k in message) {
            v = message[k];
            if (bodymessage.hasOwnProperty(k)) {
              message[k] = bodymessage[k];
            }
          }
          me.lastStartJobMessage = message;
          this.initStartJobMessage();
          me.job_id = message.job_id;
          if (typeof message.addressfield === 'string') {
            me.addressfield = message.addressfield;
          }
          me.setJobId(message.job_id);
          me.setWeightMode(message.weight_mode);
          me.customerNumber = message.customerNumber;
          me.setCustomerNumber(message.customerNumber);
          if (message.waregroup != null) {
            me.waregroup = message.waregroup;
          }
          me.setPrintOffset(message.label_offset);
          me.setDateAhead(message.date_offset);
          me.setPrintDate(message.print_date);
          me.setPrintEndorsement(message.print_endorsement);
          endorsement1 = '';
          if (message.endorsement1) {
            endorsement1 = message.endorsement1;
          }
          endorsement2 = '';
          if (message.endorsement2) {
            endorsement2 = message.endorsement2;
          }
          adv = '';
          if (message.advert) {
            if (message.advert.length > 30) {
              adv = message.advert;
            }
          }
          me.setEndorsementText1(endorsement1);
          me.setEndorsementText2(endorsement2);
          if (adv.length > 30) {
            me.setAdvertHex(adv);
          }
          me.setImprintChannelPort(me.imprint.getPort());
          me.setImprintChannelIP(me.imprint.getIP());
          return me.startJob();
        }
      } catch (error1) {
        e = error1;
        return res.send(JSON.stringify({
          success: false,
          msg: e.message
        }));
      }
    };

    HSEXPRESS.prototype.currentJob = function(job) {
      this.currentJobID = job;
      if (process.env.DEBUG_BBS_HTTPSERVER === '1') {
        console.log('set job: ', job);
      }
      return fs.writeFile(this.jobfile, job, function(err) {
        if (err) {
          throw err;
        }
      });
    };

    HSEXPRESS.prototype.setCustomerFile = function(kn) {
      return fs.exists('/opt/grab/customer.txt', function(exists) {
        if (exists) {
          return fs.writeFile('/opt/grab/customer.txt', kn, function(err) {
            if (err) {
              return console.log(err);
            }
          });
        }
      });
    };

    return HSEXPRESS;

  })(P);

}).call(this);
