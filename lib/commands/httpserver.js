(function() {
  var HttpServer, Server,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Server = require('./httpserver/Server');

  module.exports = HttpServer = (function(superClass) {
    extend(HttpServer, superClass);

    function HttpServer() {
      return HttpServer.__super__.constructor.apply(this, arguments);
    }

    HttpServer.dummy = function() {
      return "    ";
    };

    return HttpServer;

  })(Server);

}).call(this);
