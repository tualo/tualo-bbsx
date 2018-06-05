P = require './HSEXPRESS'

module.exports =
class Server extends P
  constructor: ->
    super()
    @on 'start', @initServer

  initServer: () ->
    console.log "Server", "initServer"