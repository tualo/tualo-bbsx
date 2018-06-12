(function() {
  var Command, EventEmitter, Imprint, MSG2CUCLOSESERVICE, MSG2CUOPENSERVICE, MSG2CUPREPARESIZE, MSG2CUSTARTPRINTJOB, MSG2DCACK, Message, MessageWrapper, Net, Sequence, Start, fs, mixOf, path, spawn,
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

  MSG2CUSTARTPRINTJOB = require('../FP/MSG2CUSTARTPRINTJOB');

  Imprint = require('../Service/Imprint');

  Sequence = require('../Sequence/SeqStatus');

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

  module.exports = Start = (function(superClass) {
    extend(Start, superClass);

    function Start() {
      return Start.__super__.constructor.apply(this, arguments);
    }

    Start.commandName = 'start';

    Start.commandArgs = ['ip', 'port'];

    Start.commandShortDescription = 'start a print job';

    Start.options = [];

    Start.help = function() {
      return "";
    };

    Start.prototype.action = function(options, args) {
      this.quiet = false;
      if (args.port) {
        this.imprint = null;
        if (args.ip !== '0') {
          this.imprint = new Imprint(args.ip);
          this.imprint.on('imprint', this.onImprint.bind(this));
          this.imprint.open();
          this.args = args;
          return setTimeout(this.deferedRun.bind(this), 1000);
        }
      }
    };

    Start.prototype.deferedRun = function() {
      var args;
      args = this.args;
      console.log(this, this.sequence_message, this.run, Start);
      this.message().setImprintChannelPort(this.imprint.getPort());
      this.message().setImprintChannelIP(this.imprint.getIP());
      return this.run(args.ip, args.port, 1);
    };

    Start.prototype.onImprint = function(message) {
      return console.log(message.machine_no * 100000000 + message.imprint_no);
    };

    return Start;

  })(mixOf(Command, Sequence));

}).call(this);
