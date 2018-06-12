(function() {
  var Command, EventEmitter, MSG2CUCLOSESERVICE, MSG2CUGETSTATUSLIGHT, MSG2CUOPENSERVICE, MSG2CUPREPARESIZE, MSG2DCACK, Message, MessageWrapper, Net, SeqStatus, Sequence, fs, path, spawn,
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

  Sequence = require('./Seq');

  module.exports = SeqStatus = (function(superClass) {
    extend(SeqStatus, superClass);

    function SeqStatus() {
      return SeqStatus.__super__.constructor.apply(this, arguments);
    }

    SeqStatus.prototype.sequence_message = new MSG2CUGETSTATUSLIGHT;

    SeqStatus.prototype.open_service_id = Message.SERVICE_STATUS_LIGHT;

    SeqStatus.prototype.service_return_type = Message.TYPE_BBS_RETURN_STATUS_LIGHT;

    return SeqStatus;

  })(Sequence);

}).call(this);
