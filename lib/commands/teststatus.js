(function() {
  var Command, EventEmitter, Net, Status, Teststatus, fs, path, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Command = require('tualo-commander').Command;

  path = require('path');

  fs = require('fs');

  spawn = require('child_process').spawn;

  EventEmitter = require('events').EventEmitter;

  Net = require('net');

  Status = require('./status');

  module.exports = Teststatus = (function(superClass) {
    extend(Teststatus, superClass);

    function Teststatus() {
      return Teststatus.__super__.constructor.apply(this, arguments);
    }

    Teststatus.commandName = 'teststatus';

    return Teststatus;

  })(Status);

}).call(this);
