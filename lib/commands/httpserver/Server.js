(function() {
  var P, Server,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  P = require('./HSEXPRESS');

  module.exports = Server = (function(superClass) {
    extend(Server, superClass);

    function Server() {
      Server.__super__.constructor.call(this);
      this.on('start', this.initServer);
    }

    Server.prototype.initServer = function() {
      return console.log("Server", "initServer");
    };

    return Server;

  })(P);

}).call(this);
