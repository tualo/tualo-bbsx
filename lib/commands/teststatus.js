(function() {
  var Command, EventEmitter, MSG2CUCLOSESERVICE, MSG2CUGETSTATUSLIGHT, MSG2CUOPENSERVICE, MSG2CUPREPARESIZE, MSG2DCACK, Message, MessageWrapper, Net, Teststatus, fs, mixOf, path, spawn,
    slice = [].slice,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Command = require('tualo-commander').Command;

  path = require('path');

  fs = require('fs');

  spawn = require('child_process').spawn;

  EventEmitter = require('events').EventEmitter;

  Net = require('net');

  Message = require('../FP/Message');

  MessageWrapper = require('../FP/MessageWrapper');

  MSG2DCACK = require('../FP/MSG2DCACK');

  MSG2CUOPENSERVICE = require('../FP/MSG2CUOPENSERVICE');

  MSG2CUCLOSESERVICE = require('../FP/MSG2CUCLOSESERVICE');

  MSG2CUPREPARESIZE = require('../FP/MSG2CUPREPARESIZE');

  MSG2CUGETSTATUSLIGHT = require('../FP/MSG2CUGETSTATUSLIGHT');

  mixOf = function() {
    var Mixed, base, mixins;
    base = arguments[0], mixins = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    Mixed = (function(superClass) {
      var i, method, mixin, name, ref;

      extend(Mixed, superClass);

      function Mixed() {
        return Mixed.__super__.constructor.apply(this, arguments);
      }

      for (i = mixins.length - 1; i >= 0; i += -1) {
        mixin = mixins[i];
        ref = mixin.prototype;
        for (name in ref) {
          method = ref[name];
          Mixed.prototype[name] = method;
        }
      }

      return Mixed;

    })(base);
    return Mixed;
  };

  module.exports = Teststatus = (function(superClass) {
    extend(Teststatus, superClass);

    function Teststatus() {
      return Teststatus.__super__.constructor.apply(this, arguments);
    }

    Teststatus.commandName = 'teststatus';

    Teststatus.commandArgs = ['ip', 'port', 'repeat'];

    Teststatus.commandShortDescription = 'running the bbs machine controll service';

    Teststatus.options = [];

    Teststatus.help = function() {
      return "";
    };

    Teststatus.prototype.action = function(options, args) {
      if (args.port) {
        this.args = args;
        this.args.repeat *= 1;
        return this.status();
      }
    };

    Teststatus.prototype.status = function() {
      if (this.args.repeat > 0) {
        this.client = Net.createConnection(this.args.port, this.args.ip, this.onConnect.bind(this));
        this.client.setTimeout(1200);
        this.client.setNoDelay(true);
        this.client.on('close', this.onClose.bind(this));
        this.client.on('end', this.onEnd.bind(this));
        this.client.on('data', this.onData.bind(this));
        this.client.on('error', this.onError.bind(this));
        return this.client.on('timeout', this.onTimeout.bind(this));
      }
    };

    Teststatus.prototype.onConnect = function() {
      return this.openService();
    };

    Teststatus.prototype.openService = function() {
      var message, sendbuffer, sizemessage;
      this.isOpenService = true;
      message = new MSG2CUOPENSERVICE;
      message.setServiceID(Message.SERVICE_STATUS_LIGHT);
      sendbuffer = message.toFullByteArray();
      sizemessage = new MSG2CUPREPARESIZE;
      sizemessage.setSize(sendbuffer.length);
      this.client.write(sizemessage.getBuffer());
      this.client.write(sendbuffer);
      return console.info('>>>>>>', sendbuffer);
    };

    Teststatus.prototype.closeService = function() {
      var message, sendbuffer, sizemessage;
      message = new MSG2CUCLOSESERVICE;
      sendbuffer = message.toFullByteArray();
      sizemessage = new MSG2CUPREPARESIZE;
      sizemessage.setSize(sendbuffer.length);
      this.client.write(sizemessage.getBuffer());
      this.client.write(sendbuffer);
      return console.info('>>>>>>', sendbuffer);
    };

    Teststatus.prototype.sendService = function() {
      var message, sendbuffer, sizemessage;
      message = new MSG2CUGETSTATUSLIGHT;
      sendbuffer = message.toFullByteArray();
      sizemessage = new MSG2CUPREPARESIZE;
      sizemessage.setSize(sendbuffer.length);
      this.client.write(sizemessage.getBuffer());
      this.client.write(sendbuffer);
      return console.info('>>>>>>', sendbuffer);
    };

    Teststatus.prototype.onData = function(data) {
      var buf, hex, message;
      hex = data.toString('hex');
      message = MessageWrapper.getMessageObject(data);
      if ((message.interface_of_message === 5 && message.type_of_message === 1) || (message.type_of_message === Message.TYPE_PREPARE_SIZE)) {
        buf = Buffer.from(hex.substr(20), 'hex');
        if (buf.length > 0) {
          message = MessageWrapper.getMessageObject(buf);
        } else {
          return;
        }
      }
      if (message.interface_of_message === Message.INTERFACE_SO && message.type_of_message === Message.TYPE_NAK) {
        return console.error('HSCTRL', 'onData', 'Message.TYPE_NAK', message);
      } else if (message.interface_of_message === Message.INTERFACE_SO && message.type_of_message === Message.TYPE_ACK) {
        if (message.serviceID === Message.SERVICE_STATUS_LIGHT && this.isOpenService === true) {
          this.isOpenService = false;
          return this.sendService();
        } else if (message.serviceID === Message.SERVICE_STATUS_LIGHT && this.isOpenService === false) {
          return console.error('HSCTRL', 'onData', 'OK WE ARE DONE!');
        } else if (message.serviceID === 0 && this.isOpenService === false) {
          console.error('HSCTRL', 'onData', 'OK WE ARE DONE! message.serviceID == 0');
          this.client.end();
          return console.error('HSCTRL', 'after @client.end()', this.client.destroyed);
        } else {
          return console.error('HSCTRL', 'onData', 'FAIL', message);
        }
      } else if (message.interface_of_message === Message.INTERFACE_DI && message.type_of_message === Message.TYPE_BBS_RETURN_STATUS_LIGHT) {
        console.info('HSCTRL', 'onData', 'OK', message);
        return this.closeService();
      } else {
        return console.error('HSCTRL', 'onData', 'FAIL', 'message was not expected here', message, Message.TYPE_ACK, Message.TYPE_BBS_RETURN_STATUS_LIGHT);
      }
    };

    Teststatus.prototype.onEnd = function(data) {
      return console.error('HSCTRL', 'onEnd', data);
    };

    Teststatus.prototype.onClose = function() {
      console.error('HSCTRL', 'onClose');
      this.args.repeat--;
      return setTimeout(this.status.bind(this), 1000);
    };

    Teststatus.prototype.onTimeout = function() {
      return console.error('HSCTRL', 'onTimeout');
    };

    Teststatus.prototype.onError = function(err) {
      console.error('HSCTRL', 'onError');
      if (err.code === 'EADDRNOTAVAIL') {
        return console.error('HSCTRL', 'machine offline EADDRNOTAVAIL');
      } else if (err.code === 'ECONNREFUSED') {
        return console.error('HSCTRL', 'machine offline ECONNREFUSED');
      } else {
        return console.error('HSCTRL', 'error', 'des', this.client.destroyed);
      }
    };

    return Teststatus;

  })(mixOf(Command, EventEmitter));

}).call(this);
