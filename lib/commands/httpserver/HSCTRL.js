(function() {
  var HSCMD, HSCTRL, MSG2CUCLOSESERVICE, MSG2CUGETSTATUSLIGHT, MSG2CUOPENSERVICE, MSG2CUPREPARESIZE, MSG2DCACK, Message, MessageWrapper, Net,
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

  module.exports = HSCTRL = (function(superClass) {
    extend(HSCTRL, superClass);

    function HSCTRL() {
      HSCTRL.__super__.constructor.call(this);
      this.on('start', this.initCtrlPort);
    }

    HSCTRL.prototype.initCtrlPort = function() {
      var me;
      me = this;
      this.lasteventname = 'none';
      console.log("HSCTRL", "initCtrlPort");
      this.client = Net.createConnection(this.args.machine_port, this.args.machine_ip, (function(_this) {
        return function() {
          return _this.onConnect();
        };
      })(this));
      this.client.setTimeout(3000);
      this.client.on('timeout', function(err) {
        if (process.env.DEBUG_BBS_CONTROLLER === '1') {
          console.log('controller socket timeout');
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
          return setTimeout(me.initCtrlPort.bind(me), 1000);
        } else {
          console.error('HSCTRL', 'error');
          console.trace(err);
          return me.emit('ctrl_error', err);
        }
      });
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
      var message;
      console.log('HSCTRL', 'onData', data);
      message = MessageWrapper.getMessageObject(data);
      if (message === -1) {
        return;
      }
      return this.emit('ctrl_message', message);
    };

    HSCTRL.prototype.onClose = function() {
      return this.emit("ctrl_closed", this.lasteventname);
    };

    HSCTRL.prototype.onEnd = function() {
      return this.emit("ctrl_end", this.lasteventname);
    };

    HSCTRL.prototype.onConnect = function() {
      var fn;
      console.log('onConnect');
      this.emit('ctrl_ready');
      fn = function() {
        console.log('start statusLight');
        return this.statusLight();
      };
      return setTimeout(fn.bind(this), 2000);
    };

    HSCTRL.prototype.ctrlSendCloseService = function() {
      var message, sendbuffer, sizemessage;
      message = new MSG2CUCLOSESERVICE;
      sendbuffer = message.toFullByteArray();
      sizemessage = new MSG2CUPREPARESIZE;
      sizemessage.setSize(sendbuffer.length);
      this.client.write(sizemessage.getBuffer());
      return this.client.write(sendbuffer);
    };

    HSCTRL.prototype.ctrlSendOpenService = function(type) {
      var message, sendbuffer, sizemessage;
      message = new MSG2CUOPENSERVICE;
      message.setServiceID(type);
      sendbuffer = message.toFullByteArray();
      sizemessage = new MSG2CUPREPARESIZE;
      sizemessage.setSize(sendbuffer.length);
      this.client.write(sizemessage.getBuffer());
      return this.client.write(sendbuffer);
    };

    HSCTRL.prototype.statusLight = function() {
      this.once('ctrl_message', (function(_this) {
        return function(message) {
          return _this.ctrlOnOpenService(message);
        };
      })(this));
      return this.ctrlSendOpenService(Message.SERVICE_STATUS_LIGHT);
    };

    HSCTRL.prototype.ctrlOnOpenService = function(message) {
      if (process.env.DEBUG_BBS_STATUS === '1') {
        console.log(message);
      }
      if (message.type_of_message === Message.TYPE_ACK && message.serviceID === Message.SERVICE_STATUS_LIGHT) {
        this.once('ctrl_message', (function(_this) {
          return function(message) {
            return _this.ctrlOnGetStatusLight(message);
          };
        })(this));
        if (process.env.DEBUG_BBS_STATUS === '1') {
          console.log('ctrlSendStatusLight');
        }
        return this.ctrlSendStatusLight();
      }
    };

    HSCTRL.prototype.ctrlOnGetStatusLight = function(message) {
      if (process.env.DEBUG_BBS_STATUS === '1') {
        console.log('onGetStatusLight', message, Message.TYPE_BBS_RETURN_STATUS_LIGHT);
      }
      if (message.type_of_message === Message.TYPE_BBS_RETURN_STATUS_LIGHT) {
        this.message = message;
        this.once('ctrl_message', (function(_this) {
          return function(message) {
            return _this.onCloseService(message);
          };
        })(this));
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

    return HSCTRL;

  })(HSCMD);

}).call(this);
