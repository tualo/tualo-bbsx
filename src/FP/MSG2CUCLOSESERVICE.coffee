Message = require './Message'

module.exports =
class MSG2CUCLOSESERVICE extends Message
  constructor: () ->
    @serviceID = 0
    @errorCode = 0
    @info = ""
    @setMessageInterface Message.INTERFACE_SO
    @setMessageType Message.TYPE_CLOSE_SERVICE
  setApplictiondata: () ->
    @app_data = Buffer.alloc 0
