(function() {
  var Command, EventEmitter, MSG2CUCLOSESERVICE, MSG2CUGETSTATUSLIGHT, MSG2CUOPENSERVICE, MSG2CUPREPARESIZE, MSG2DCACK, Message, MessageWrapper, Net, Seq, fs, mixOf, path, spawn,
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

  module.exports = Seq = (function(superClass) {
    extend(Seq, superClass);

    function Seq() {
      return Seq.__super__.constructor.apply(this, arguments);
    }

    Seq.prototype.message = function() {
      return this.sequence_message;
    };

    Seq.prototype.run = function(ip, port, repeat) {
      this.args = {
        ip: ip,
        port: port,
        repeat: repeat
      };
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

    Seq.prototype.onConnect = function() {
      if (this.quiet === false) {
        console.info('onConnect', this.args);
      }
      this.emit('connected');
      return this.openService();
    };

    Seq.prototype.openService = function() {
      var message, sendbuffer, sizemessage;
      this.isOpenService = true;
      message = new MSG2CUOPENSERVICE;
      message.setServiceID(this.open_service_id);
      sendbuffer = message.toFullByteArray();
      sizemessage = new MSG2CUPREPARESIZE;
      sizemessage.setSize(sendbuffer.length);
      this.client.write(sizemessage.getBuffer());
      this.client.write(sendbuffer);
      if (this.quiet === false) {
        console.info('>>>>>>', sendbuffer);
      }
      return this.emit('open_service');
    };

    Seq.prototype.closeService = function() {
      var message, sendbuffer, sizemessage;
      message = new MSG2CUCLOSESERVICE;
      sendbuffer = message.toFullByteArray();
      sizemessage = new MSG2CUPREPARESIZE;
      sizemessage.setSize(sendbuffer.length);
      this.client.write(sizemessage.getBuffer());
      this.client.write(sendbuffer);
      if (this.quiet === false) {
        console.info('>>>>>>', sendbuffer);
      }
      return this.emit('close_service');
    };

    Seq.prototype.sendService = function() {
      var sendbuffer, sizemessage;
      sendbuffer = this.sequence_message.toFullByteArray();
      sizemessage = new MSG2CUPREPARESIZE;
      sizemessage.setSize(sendbuffer.length);
      this.client.write(sizemessage.getBuffer());
      this.client.write(sendbuffer);
      if (this.quiet === false) {
        console.info('>>>>>>', sendbuffer);
      }
      return this.emit('send_service');
    };

    Seq.prototype.onData = function(data) {
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
        if (this.quiet === false) {
          return console.error('HSCTRL', 'onData', 'Message.TYPE_NAK', message);
        }
      } else if (message.interface_of_message === Message.INTERFACE_SO && message.type_of_message === Message.TYPE_ACK) {
        if (message.serviceID === this.open_service_id && this.isOpenService === true) {
          this.isOpenService = false;
          return this.sendService();
        } else if ((message.serviceID === this.open_service_id && this.isOpenService === false) || (message.serviceID === 0 && this.isOpenService === false)) {
          console.error('HSCTRL', 'onData', 'OK WE ARE DONE!');
          return this.client.end();
        } else {
          if (this.quiet === false) {
            return console.error('HSCTRL', 'onData', 'FAIL', message);
          }
        }
      } else if (message.interface_of_message === Message.INTERFACE_DI && message.type_of_message === this.service_return_type) {
        console.info('HSCTRL', 'onData', 'OK', message);
        this.last_message = message;
        this.emit('sequence_message', message);
        return this.closeService();
      } else {
        if (this.quiet === false) {
          return console.error('HSCTRL', 'onData', 'FAIL', 'message was not expected here', message, Message.TYPE_ACK, this.service_return_type);
        }
      }
    };

    Seq.prototype.onEnd = function(data) {
      if (this.quiet === false) {
        return console.error('HSCTRL', 'onEnd', data);
      }
    };

    Seq.prototype.onClose = function() {
      var fn;
      if (this.quiet === false) {
        console.error('HSCTRL', 'onClose', new Date(), this.args);
      }
      this.emit('sequence_complete', this.last_message);
      this.args.repeat--;
      fn = function() {
        return this.run(this.args.ip, this.args.port, this.args.repeat);
      };
      return setTimeout(fn.bind(this), 1000);
    };

    Seq.prototype.onTimeout = function() {
      this.emit('sequence_timeout');
      this.client.destroy();
      if (this.quiet === false) {
        return console.error('HSCTRL', 'onTimeout * ', this.client);
      }
    };

    Seq.prototype.onError = function(err) {
      this.emit('sequence_error');
      this.client.destroy();
      if (this.quiet === false) {
        console.error('HSCTRL', 'onError');
      }
      if (err.code === 'EADDRNOTAVAIL') {
        if (this.quiet === false) {
          return console.error('HSCTRL', 'machine offline EADDRNOTAVAIL');
        }
      } else if (err.code === 'ECONNREFUSED') {
        if (this.quiet === false) {
          return console.error('HSCTRL', 'machine offline ECONNREFUSED');
        }
      } else {
        if (this.quiet === false) {
          return console.error('HSCTRL', 'error', 'des', this.client.destroyed);
        }
      }
    };

    return Seq;

  })(EventEmitter);

}).call(this);
