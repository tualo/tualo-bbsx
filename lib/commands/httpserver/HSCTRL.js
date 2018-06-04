(function() {
  var HSCMD, HSCTRL, Net,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  HSCMD = require('./HSCMD');

  Net = require('net');

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
      if (process.env.DEBUG_BBS_CONTROLLER === '1') {
        return console.log('-----');
      }
    };

    HSCTRL.prototype.onClose = function() {
      return this.emit("ctrl_closed", this.lasteventname);
    };

    HSCTRL.prototype.onEnd = function() {
      return this.emit("ctrl_end", this.lasteventname);
    };

    HSCTRL.prototype.onConnect = function() {
      console.log('onConnect');
      return this.emit('ctrl_ready');
    };

    return HSCTRL;

  })(HSCMD);

}).call(this);
