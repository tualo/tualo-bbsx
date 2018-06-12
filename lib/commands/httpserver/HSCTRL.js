(function() {
  var HSCMD, HSCTRL, Net, SeqStatus,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  HSCMD = require('./HSCMD');

  Net = require('net');

  SeqStatus = require('../../Sequence/SeqStatus');

  module.exports = HSCTRL = (function(superClass) {
    extend(HSCTRL, superClass);

    function HSCTRL() {
      HSCTRL.__super__.constructor.call(this);
      this.serviceOpen = false;
      this.state = 0;
      this.lastState = null;
      this.statusLightIndex = 0;
      this.statusLightTimer = setInterval(this.statusLight.bind(this), 1500);
    }

    HSCTRL.prototype.statusLight = function() {
      var seq;
      seq = new SeqStatus();
      seq.quiet = true;
      seq.on('sequence_message', this.onStatusMessage.bind(this));
      seq.on('sequence_error', this.onStatusError.bind(this));
      seq.on('sequence_timeout', this.onStatusTimeout.bind(this));
      return seq.run(this.args.machine_ip, this.args.machine_port, 1);
    };

    HSCTRL.prototype.onStatusMessage = function(message) {
      this.lastError = null;
      return this.lastState = message;
    };

    HSCTRL.prototype.onStatusError = function(err) {
      console.log('onStatusError', err.code);
      return this.lastError = err;
    };

    HSCTRL.prototype.onStatusTimeout = function(err) {
      console.log('onStatusTimeout');
      return this.lastError = err;
    };

    return HSCTRL;

  })(HSCMD);

}).call(this);
