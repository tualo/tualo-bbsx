(function() {
  var HSCMD, HSCTRL, MSG2CUCLOSESERVICE, MSG2CUGETSTATUSLIGHT, MSG2CUOPENSERVICE, MSG2CUPREPARESIZE, MSG2CUSTARTPRINTJOB, MSG2CUSTOPPRINTJOB, MSG2DCACK, Message, MessageWrapper, Net,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  HSCMD = require('./HSCMD');

  Net = require('net');

  Message = require('../../FP/Message');

  MessageWrapper = require('../../FP/MessageWrapper');

  MSG2DCACK = require('../../FP/MSG2DCACK');

  MSG2CUOPENSERVICE = require('../../FP/MSG2CUOPENSERVICE');

  MSG2CUCLOSESERVICE = require('../../FP/MSG2CUCLOSESERVICE');

  MSG2CUPREPARESIZE = require('../../FP/MSG2CUPREPARESIZE');

  MSG2CUGETSTATUSLIGHT = require('../../FP/MSG2CUGETSTATUSLIGHT');

  MSG2CUSTARTPRINTJOB = require('../../FP/MSG2CUSTARTPRINTJOB');

  MSG2CUSTOPPRINTJOB = require('../../FP/MSG2CUSTOPPRINTJOB');

  module.exports = HSCTRL = (function(superClass) {
    extend(HSCTRL, superClass);

    function HSCTRL() {
      HSCTRL.__super__.constructor.call(this);
      this.serviceOpen = false;
      this.state = 0;
      this.lastState = null;
      this.statusLightTimer = setInterval(this.statusLight.bind(this), 2500);
    }

    HSCTRL.prototype.initCtrlPort = function() {
      var fn, me;
      me = this;
      console.log("HSCTRL", "initCtrlPort");
      fn = function() {
        clearTimeout(me.ctrlConnectionTimeout);
        if (me.client.connecting) {
          me.client.destroy();
          console.log('CTRL', 'connection timeout');
          me.emit('ctrl_timeout', {
            msg: 'socket timeout',
            code: 'ETIMEDOUT',
            address: me.ip
          });
          return me.state = -1;
        }
      };
      this.ctrlConnectionTimeout = setTimeout(fn, 900);
      if (this.client) {
        this.client.removeAllListeners();
      }
      this.client = Net.createConnection(this.args.machine_port, this.args.machine_ip, (function(_this) {
        return function() {
          return _this.onConnect();
        };
      })(this));
      this.client.on('timeout', function(err) {
        if (process.env.DEBUG_BBS_CONTROLLER === '1') {
          console.log('controller socket timeout');
          me.state = -1;
        }
        return me.emit('ctrl_timeout', {
          msg: 'socket timeout',
          code: 'ETIMEDOUT',
          address: me.ip
        });
      });
      this.client.on('error', function(err) {
        if (err.code === 'EADDRNOTAVAIL') {
          console.error('HSCTRL', 'machine offline');
          me.emit('ctrl_offline', 'machine offline');
        } else if (err.code === 'ECONNREFUSED') {
          console.error('HSCTRL', 'machine offline refused');
          me.emit('ctrl_offline', 'machine offline');
        } else {
          console.error('HSCTRL', 'error', 'des', me.client.destroyed);
          console.trace(err);
          me.emit('ctrl_error', err);
        }
        return me.state = -1;
      });
      this.client.setTimeout(990);
      this.client.setNoDelay(true);
      this.client.on('close', (function(_this) {
        return function() {
          return _this.onClose();
        };
      })(this));
      this.client.on('end', (function(_this) {
        return function() {
          return _this.onEnd();
        };
      })(this));
      this.client.on('data', (function(_this) {
        return function(data) {
          return _this.onData(data);
        };
      })(this));
      if (process.env.DEBUG_BBS_CONTROLLER === '1') {
        return console.log('-----');
      }
    };

    HSCTRL.prototype.onData = function(data) {
      var buf, hex, message;
      hex = data.toString('hex');
      console.log('HSCTRL', 'onData', hex);
      message = MessageWrapper.getMessageObject(data);
      console.log('HSCTRL', 'onData', message);
      if (message.type_of_message === Message.TYPE_PREPARE_SIZE) {
        buf = Buffer.from(hex.substr(20), 'hex');
        console.log('HSCTRL', 'TYPE_PREPARE_SIZE', hex.substr(20), buf);
        if (buf.length > 0) {
          message = MessageWrapper.getMessageObject(buf);
          console.log('HSCTRL', '>>>>>>', message);
          return this.emit('ctrl_message', message);
        }
      } else {
        return this.emit('ctrl_message', message);
      }
    };

    HSCTRL.prototype.onClose = function() {
      return console.log('HSCTRL', 'onClose');
    };

    HSCTRL.prototype.onEnd = function() {
      return console.log('HSCTRL', 'onEnd');
    };

    HSCTRL.prototype.onConnect = function() {
      this.serviceOpen = false;
      clearTimeout(this.ctrlConnectionTimeout);
      console.log('onConnect');
      this.state = 1;
      return this.emit('ctrl_ready');
    };

    HSCTRL.prototype.ctrlSendCloseService = function() {
      var message, sendbuffer, sizemessage;
      message = new MSG2CUCLOSESERVICE;
      sendbuffer = message.toFullByteArray();
      sizemessage = new MSG2CUPREPARESIZE;
      sizemessage.setSize(sendbuffer.length);
      this.client.write(sizemessage.getBuffer());
      this.client.write(sendbuffer);
      this.serviceOpen = false;
      return this.emit('ctrl_closeservice');
    };

    HSCTRL.prototype.ctrlSendOpenService = function(type) {
      var message, sendbuffer, sizemessage;
      if (this.serviceOpen === true) {
        throw Error('service is allready opened');
      }
      message = new MSG2CUOPENSERVICE;
      message.setServiceID(type);
      sendbuffer = message.toFullByteArray();
      sizemessage = new MSG2CUPREPARESIZE;
      sizemessage.setSize(sendbuffer.length);
      this.client.write(sizemessage.getBuffer());
      this.client.write(sendbuffer);
      return this.serviceOpen = true;
    };

    HSCTRL.prototype.statusLight = function() {
      this.removeAllListeners('ctrl_ready');
      this.removeAllListeners('ctrl_closeservice');
      this.once('ctrl_ready', (function(_this) {
        return function() {
          console.log('get status _statusLight');
          return _this._statusLight();
        };
      })(this));
      this.once('ctrl_closeservice', (function(_this) {
        return function() {
          console.log('get status ctrl_closeservice');
          return _this.client.end();
        };
      })(this));
      return this.initCtrlPort();
    };

    HSCTRL.prototype._statusLight = function() {
      clearTimeout(this.statusTimer);
      if (this.client.destroyed === true) {
        return;
      }
      if (this.serviceOpen === true) {
        console.log('get status light DEFERED');
        return this.statusTimer = setTimeout(this.statusLight.bind(this), 100);
      } else {
        console.log('get status light');
        this.once('ctrl_message', (function(_this) {
          return function(message) {
            return _this.ctrlOnOpenService(message);
          };
        })(this));
        return this.ctrlSendOpenService(Message.SERVICE_STATUS_LIGHT);
      }
    };

    HSCTRL.prototype.ctrlOnOpenService = function(message) {
      console.log('ctrlOnOpenService', message, Message.SERVICE_STATUS_LIGHT, Message.TYPE_ACK);
      if (message.type_of_message === Message.TYPE_ACK && message.serviceID === Message.SERVICE_STATUS_LIGHT) {
        this.once('ctrl_message', (function(_this) {
          return function(message) {
            return _this.ctrlOnGetStatusLight(message);
          };
        })(this));
        console.log('ctrlSendStatusLight');
        return this.ctrlSendStatusLight();
      }
    };

    HSCTRL.prototype.ctrlOnGetStatusLight = function(message) {
      console.log('onGetStatusLight', message, Message.TYPE_BBS_RETURN_STATUS_LIGHT);
      if (message.type_of_message === Message.TYPE_BBS_RETURN_STATUS_LIGHT) {
        this.lastState = message;
        console.log('ctrlOnGetStatusLight', message);
        return this.ctrlSendCloseService();
      } else {

      }
    };

    HSCTRL.prototype.ctrlSendStatusLight = function() {
      var message, sendbuffer, sizemessage;
      message = new MSG2CUGETSTATUSLIGHT;
      sendbuffer = message.toFullByteArray();
      sizemessage = new MSG2CUPREPARESIZE;
      sizemessage.setSize(sendbuffer.length);
      this.client.write(sizemessage.getBuffer());
      return this.client.write(sendbuffer);
    };

    HSCTRL.prototype.setJobId = function(val) {
      return this.start_message.setJobId(parseInt(val));
    };

    HSCTRL.prototype.setCustomerId = function(val) {
      return this.start_message.setCustomerId(parseInt(val));
    };

    HSCTRL.prototype.setPrintDate = function(val) {
      return this.start_message.setPrintDate(parseInt(val));
    };

    HSCTRL.prototype.setDateAhead = function(val) {
      return this.start_message.setDateAhead(parseInt(val));
    };

    HSCTRL.prototype.setWeightMode = function(val) {
      return this.start_message.setWeightMode(parseInt(val));
    };

    HSCTRL.prototype.setPrintOffset = function(val) {
      return this.start_message.setPrintOffset(parseInt(val));
    };

    HSCTRL.prototype.setImageId = function(val) {
      return this.start_message.setImageId(parseInt(val));
    };

    HSCTRL.prototype.setPrintEndorsement = function(val) {
      return this.start_message.setPrintEndorsement(parseInt(val));
    };

    HSCTRL.prototype.setEndorsementID = function(val) {
      return this.start_message.setEndorsementID(parseInt(val));
    };

    HSCTRL.prototype.setEndorsementText1 = function(val) {
      return this.start_message.setEndorsementText1(val);
    };

    HSCTRL.prototype.setEndorsementText2 = function(val) {
      return this.start_message.setEndorsementText2(val);
    };

    HSCTRL.prototype.setAdvert = function(val) {
      return this.start_message.setAdvert(val);
    };

    HSCTRL.prototype.setAdvertHex = function(val) {};

    HSCTRL.prototype.setTownCircleID = function(val) {
      return this.start_message.setTownCircleID(parseInt(val));
    };

    HSCTRL.prototype.setTownCircle = function(val) {
      return this.start_message.setTownCircle(val);
    };

    HSCTRL.prototype.setCustomerNumber = function(val) {
      return this.start_message.setCustomerNumber(val);
    };

    HSCTRL.prototype.setImprintChannelIP = function(val) {
      return this.start_message.setImprintChannelIP(val);
    };

    HSCTRL.prototype.setImprintChannelPort = function(val) {
      return this.start_message.setImprintChannelPort(parseInt(val));
    };

    HSCTRL.prototype.initStartJobMessage = function() {
      if (process.env.DEBUG_BBS_STARTJOB === '1') {
        console.log('StartPrintjob', 'init');
      }
      return this.start_message = new MSG2CUSTARTPRINTJOB;
    };

    HSCTRL.prototype.ctrlSendStartPrintJob = function() {
      var sendbuffer, sizemessage;
      if (process.env.DEBUG_BBS_STARTJOB === '1') {
        console.log("start message>", this.start_message);
      }
      sendbuffer = this.start_message.toFullByteArray();
      sizemessage = new MSG2CUPREPARESIZE;
      sizemessage.setSize(sendbuffer.length);
      if (process.env.DEBUG_BBS_STARTJOB === '1') {
        console.log("sizemessage> ", sizemessage.getBuffer().toString('hex'));
      }
      this.client.write(sizemessage.getBuffer());
      if (process.env.DEBUG_BBS_STARTJOB === '1') {
        console.log("sendbuffer> ", sendbuffer.toString('hex'));
        console.log("image> ", this.start_message.advert.toString('hex'));
        console.log("image> ", this.start_message.advert.toString('base64'));
      }
      return this.client.write(sendbuffer);
    };

    HSCTRL.prototype.startJob = function() {
      this.removeAllListeners('ctrl_ready');
      this.removeAllListeners('ctrl_closeservice');
      this.once('ctrl_ready', (function(_this) {
        return function() {
          console.log('get start _startJob');
          return _this._startJob();
        };
      })(this));
      this.once('ctrl_closeservice', (function(_this) {
        return function() {
          console.log('get start ctrl_closeservice');
          return _this.client.end();
        };
      })(this));
      return this.initCtrlPort();
    };

    HSCTRL.prototype._startJob = function() {
      if (this.serviceOpen === true) {
        console.log('startJob DEFERED');
        return setTimeout(this.startJob.bind(this), 500);
      } else {
        this.once('ctrl_message', (function(_this) {
          return function(message) {
            return _this.ctrlOnOpenStartJobService(message);
          };
        })(this));
        return this.ctrlSendOpenService(Message.SERVICE_BBS_PRINTJOB);
      }
    };

    HSCTRL.prototype.ctrlOnOpenStartJobService = function(message) {
      if (process.env.DEBUG_BBS_STATUS === '1') {
        console.log(message);
      }
      if (message.type_of_message === Message.TYPE_ACK && message.serviceID === Message.SERVICE_BBS_PRINTJOB) {
        this.once('ctrl_message', (function(_this) {
          return function(message) {
            return _this.ctrlOnStartPrintJob(message);
          };
        })(this));
        if (process.env.DEBUG_BBS_STATUS === '1') {
          console.log('ctrlSendStatusLight');
        }
        return this.ctrlSendStartPrintJob();
      }
    };

    HSCTRL.prototype.ctrlOnStartPrintJob = function(message) {
      console.log('StartPrintjob', 'onStartPrintJob', message);
      if (message.type_of_message === Message.TYPE_BBS_START_PRINTJOB) {
        if (process.env.DEBUG_BBS_STARTJOB === '1') {
          console.log('StartPrintjob', 'TYPE_BBS_START_PRINTJOB', message);
          console.log('TYPE_BBS_START_PRINTJOB');
        }
        this.ctrlSendCloseService();
        if (process.env.DEBUG_BBS_STARTJOB === '1') {
          return console.log('ok closing');
        }
      } else if (message.type_of_message === Message.TYPE_ACK) {
        if (process.env.DEBUG_BBS_STARTJOB === '1') {
          console.log('StartPrintjob', 'TYPE_ACK', message);
          console.log('TYPE_ACK');
        }
        return this.ctrlSendCloseService();
      } else {
        return console.log('StartPrintjob', 'something went wrong', message.type_of_message);
      }
    };

    HSCTRL.prototype.stopJob = function() {
      this.removeAllListeners('ctrl_ready');
      this.removeAllListeners('ctrl_closeservice');
      this.once('ctrl_ready', (function(_this) {
        return function() {
          console.log('get stop _stopJob');
          return _this._stopJob();
        };
      })(this));
      this.once('ctrl_closeservice', (function(_this) {
        return function() {
          console.log('get stop ctrl_closeservice');
          return _this.client.end();
        };
      })(this));
      return this.initCtrlPort();
    };

    HSCTRL.prototype._stopJob = function() {
      if (this.serviceOpen === true) {
        console.log('stopJob DEFERED');
        return setTimeout(this.stopJob.bind(this), 100);
      } else {
        this.once('ctrl_message', (function(_this) {
          return function(message) {
            return _this.ctrlOnOpenStopJobService(message);
          };
        })(this));
        return this.ctrlSendOpenService(Message.SERVICE_BBS_PRINTJOB);
      }
    };

    HSCTRL.prototype.ctrlOnOpenStopJobService = function(message) {
      console.log('MSG2CUSTOPPRINTJOB', 'onOpenService', message.type_of_message, message.serviceID);
      if (message.type_of_message === Message.TYPE_ACK && message.serviceID === Message.SERVICE_BBS_PRINTJOB) {
        this.once('ctrl_message', (function(_this) {
          return function(message) {
            return _this.ctrlOnStopPrintJob(message);
          };
        })(this));
        return this.ctrlSendStopPrintJob();
      } else {
        return this.unexpected(message);
      }
    };

    HSCTRL.prototype.ctrlOnStopPrintJob = function(message) {
      if (process.env.DEBUG_BBS_STOPJOB === '1') {
        console.log('MSG2CUSTOPPRINTJOB', 'onStopPrintJob', message, 'Message.TYPE_BBS_STOP_PRINTJOB', Message.TYPE_BBS_STOP_PRINTJOB);
      }
      return this.ctrlSendCloseService();
    };

    HSCTRL.prototype.ctrlSendStopPrintJob = function() {
      var sendbuffer, sizemessage, stop_message;
      if (process.env.DEBUG_BBS_STOPJOB === '1') {
        console.log('MSG2CUSTOPPRINTJOB', 'stopPrintJob');
      }
      stop_message = new MSG2CUSTOPPRINTJOB;
      sendbuffer = stop_message.toFullByteArray();
      sizemessage = new MSG2CUPREPARESIZE;
      sizemessage.setSize(sendbuffer.length);
      this.client.write(sizemessage.getBuffer());
      return this.client.write(sendbuffer);
    };

    return HSCTRL;

  })(HSCMD);

}).call(this);
