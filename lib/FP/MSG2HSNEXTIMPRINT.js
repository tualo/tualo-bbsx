(function() {
  var MSG2HSNEXTIMPRINT, Message,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Message = require('./Message');

  module.exports = MSG2HSNEXTIMPRINT = (function(superClass) {
    extend(MSG2HSNEXTIMPRINT, superClass);

    function MSG2HSNEXTIMPRINT() {
      this.type = 'MSG2HSNEXTIMPRINT';
      this.bbs_version = process.env.BBS_VERSION || 2;
      this.bbs_version = parseInt(this.bbs_version);
      this.job_id = 0;
      this.customer_id = 0;
      this.machine_no = 0;
      this.imprint_no = 0;
      this.creationDate = new Date;
      this.printedDate = new Date;
      this.endorsement_id = 0;
      this.town_circle_id = 0;
      this.mail_length = 0;
      this.mail_height = 0;
      this.mail_thickness = 0;
      this.mail_weight = 0;
      this.setMessageInterface(Message.INTERFACE_DI);
      this.setMessageType(Message.TYPE_BBS_NEXT_IMPRINT);
    }

    MSG2HSNEXTIMPRINT.prototype.setBBSVersion = function(val) {
      return this.bbs_version = val;
    };

    MSG2HSNEXTIMPRINT.prototype.setJobId = function(val) {
      return this.job_id = val;
    };

    MSG2HSNEXTIMPRINT.prototype.setCustomerId = function(val) {
      return this.customer_id = val;
    };

    MSG2HSNEXTIMPRINT.prototype.setMachineNo = function(val) {
      return this.machine_no = val;
    };

    MSG2HSNEXTIMPRINT.prototype.setImprintNo = function(val) {
      return this.imprint_no = val;
    };

    MSG2HSNEXTIMPRINT.prototype.setCreationDate = function(val) {
      return this.creationDate = val;
    };

    MSG2HSNEXTIMPRINT.prototype.setPrintedDate = function(val) {
      return this.printedDate = val;
    };

    MSG2HSNEXTIMPRINT.prototype.setEndorsementId = function(val) {
      return this.endorsement_id = val;
    };

    MSG2HSNEXTIMPRINT.prototype.setTownCircleID = function(val) {
      return this.town_circle_id = val;
    };

    MSG2HSNEXTIMPRINT.prototype.setMailLength = function(val) {
      return this.mail_length = val;
    };

    MSG2HSNEXTIMPRINT.prototype.setMailHeight = function(val) {
      return this.mail_height = val;
    };

    MSG2HSNEXTIMPRINT.prototype.setMailThickness = function(val) {
      return this.mail_thickness = val;
    };

    MSG2HSNEXTIMPRINT.prototype.setMailWeight = function(val) {
      return this.mail_weight = val;
    };

    MSG2HSNEXTIMPRINT.prototype.readApplictiondata = function(data) {
      var position;
      if (data.length < 10) {
        return;
      }
      position = -4;
      this.job_id = data.readUInt32BE(position += 4);
      this.customer_id = data.readUInt32BE(position += 4);
      this.machine_no = data.readUInt32BE(position += 4);
      this.high_imprint_no = data.readUInt32BE(position += 4);
      this.low_imprint_no = data.readUInt32BE(position += 4);
      this.imprint_no = (this.high_imprint_no >> 32) + this.low_imprint_no;
      this.creationDate = data.slice(position, position + 8).readDate();
      position += 8;
      this.printedDate = data.slice(position, position + 8).readDate();
      position += 8;
      this.endorsement_id = data.readUInt32BE(position += 4);
      if (this.bbs_version === 2) {
        this.town_circle_id = data.readUInt32BE(position += 4);
      }
      this.mail_length = data.readInt32BE(position += 4);
      this.mail_height = data.readInt32BE(position += 4);
      this.mail_thickness = data.readInt32BE(position += 4);
      this.mail_weight = data.readInt32BE(position += 4);
      return this.app_data = data;
    };

    MSG2HSNEXTIMPRINT.prototype.setApplictiondata = function() {
      var data, position;
      data = new Buffer.alloc(60);
      position = 0;
      data.writeUInt32BE(this.job_id, position);
      position += 4;
      data.writeUInt32BE(this.customer_id, position);
      position += 4;
      data.writeUInt32BE(this.machine_no, position);
      position += 4;
      data.writeUInt32BE(0, position);
      position += 4;
      data.writeUInt32BE(this.imprint_no, position);
      position += 4;
      this.creationDate = new Buffer.alloc(8);
      position += 8;
      this.printedDate = new Buffer.alloc(8);
      position += 8;
      data.writeUInt32BE(this.endorsement_id, position);
      position += 4;
      if (this.bbs_version === 2) {
        data.writeUInt32BE(this.town_circle_id, position);
        position += 4;
      }
      data.writeUInt32BE(this.mail_length, position);
      position += 4;
      data.writeUInt32BE(this.mail_height, position);
      position += 4;
      data.writeUInt32BE(this.mail_thickness, position);
      position += 4;
      data.writeUInt32BE(this.mail_weight, position);
      position += 4;
      return this.app_data = data;
    };

    return MSG2HSNEXTIMPRINT;

  })(Message);

}).call(this);
