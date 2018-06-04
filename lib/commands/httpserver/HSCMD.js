(function() {
  var Command, EventEmitter, HSCTRL, fs, mixOf, path, spawn,
    slice = [].slice,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Command = require('tualo-commander').Command;

  path = require('path');

  fs = require('fs');

  spawn = require('child_process').spawn;

  EventEmitter = require('events').EventEmitter;

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

  module.exports = HSCTRL = (function(superClass) {
    extend(HSCTRL, superClass);

    function HSCTRL() {
      return HSCTRL.__super__.constructor.apply(this, arguments);
    }

    HSCTRL.commandName = 'httpserver';

    HSCTRL.commandArgs = ['port', 'machine_ip', 'machine_port', 'hostsystem', 'hostdb', 'dbuser', 'dbpass', 'jobfile'];

    HSCTRL.commandShortDescription = 'running the bbs machine controll service';

    HSCTRL.options = [];

    HSCTRL.help = function() {
      return "";
    };

    HSCTRL.prototype.action = function(options, args) {
      var me;
      if (args.port) {
        this.args = args;
        me = this;
        me.waregroup = 'Standardsendungen';
        me.jobfile = args.jobfile || '/opt/grab/job.txt';
        if (process.env.DEBUG_BBS_HTTPSERVER === '1') {
          console.log(this.args);
        }
        this.mysqlOpts = {
          host: this.args.hostsystem,
          user: this.args.dbuser,
          password: this.args.dbpass,
          database: this.args.hostdb,
          connectionLimit: 100,
          wait_timeout: 120,
          connect_timeout: 10
        };
        return this.emit('start');
      }
    };

    return HSCTRL;

  })(mixOf(Command, EventEmitter));

}).call(this);
