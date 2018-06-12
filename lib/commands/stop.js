(function() {
  var Command, EventEmitter, MSG2CUCLOSESERVICE, MSG2CUOPENSERVICE, MSG2CUPREPARESIZE, MSG2CUSTOPPRINTJOB, MSG2DCACK, Message, MessageWrapper, Net, Sequence, Stop, fs, mixOf, path, spawn,
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

  MSG2CUSTOPPRINTJOB = require('../FP/MSG2CUSTOPPRINTJOB');

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

  module.exports = Stop = (function(superClass) {
    extend(Stop, superClass);

    function Stop() {
      return Stop.__super__.constructor.apply(this, arguments);
    }

    Stop.commandName = 'stop';

    Stop.commandArgs = ['ip', 'port'];

    Stop.commandShortDescription = 'stop a print job';

    Stop.options = [];

    Stop.help = function() {
      return "";
    };

    Stop.prototype.action = function(options, args) {
      this.quiet = false;
      if (args.port) {
        return this.run(args.ip, args.port, 1);
      }
    };

    return Stop;

  })(mixOf(Command, Sequence));

}).call(this);
