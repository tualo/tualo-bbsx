(function() {
  var MSG2DCACK, Message,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Message = require('./Message');

  module.exports = MSG2DCACK = (function(superClass) {
    extend(MSG2DCACK, superClass);

    function MSG2DCACK() {
      this.serviceID = 0;
      this.setMessageInterface(Message.INTERFACE_DI);
      this.setMessageType(Message.TYPE_ACK);
    }

    MSG2DCACK.prototype.setServiceID = function(id) {
      return this.serviceID = id;
    };

    MSG2DCACK.prototype.setApplictiondata = function() {
      this.app_data = new Buffer(2);
      return this.app_data.writeUInt16BE(this.serviceID);
    };

    MSG2DCACK.prototype.readApplictiondata = function(data) {
      this.serviceID = data.readUInt16BE(0);
      return console.log('@serviceID>', this.serviceID);
    };

    return MSG2DCACK;

  })(Message);

}).call(this);
