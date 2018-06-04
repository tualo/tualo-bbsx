HSCMD = require './HSCMD'
Net = require 'net'


Message = require '../../FP/Message'
MessageWrapper = require '../../FP/MessageWrapper'

MSG2DCACK = require '../../FP/MSG2DCACK'
MSG2CUOPENSERVICE = require '../../FP/MSG2CUOPENSERVICE'
MSG2CUCLOSESERVICE = require '../../FP/MSG2CUCLOSESERVICE'
MSG2CUPREPARESIZE = require '../../FP/MSG2CUPREPARESIZE'
MSG2CUGETSTATUSLIGHT = require '../../FP/MSG2CUGETSTATUSLIGHT'


module.exports =
class HSCTRL extends HSCMD
  constructor: ->
    super()
    @on 'start', @initCtrlPort
    
  initCtrlPort: () ->
    me = @
    @lasteventname = 'none'
    console.log "HSCTRL", "initCtrlPort"

    @client = Net.createConnection @args.machine_port, @args.machine_ip, () => @onConnect()
    @client.setTimeout 3000

    @client.on 'timeout', (err) ->
      if process.env.DEBUG_BBS_CONTROLLER=='1'
        console.log 'controller socket timeout'
      me.emit 'ctrl_timeout', {msg:'socket timeout',code:'ETIMEDOUT',address:me.ip}

    @client.on 'error', (err) ->

      if err.code=='EADDRNOTAVAIL'
        console.error 'HSCTRL','machine offline'
        me.emit 'ctrl_offline', 'machine offline'
        setTimeout me.initCtrlPort.bind(me),1000
      else
        console.error 'HSCTRL','error'
        console.trace err
        me.emit 'ctrl_error', err

    @client.setNoDelay true
    @client.on 'close', () => @onClose()
    @client.on 'end', () => @onEnd()
    @client.on 'data', (data) => @onData(data)
    
    if process.env.DEBUG_BBS_CONTROLLER=='1'
      console.log '-----'

  onData: (data) ->
    console.log 'HSCTRL','onData',data
    message = MessageWrapper.getMessageObject data
    if message==-1
      return
    @emit 'ctrl_message', message

  onClose: () ->
    @emit "ctrl_closed",@lasteventname

  onEnd: () ->
    @emit "ctrl_end",@lasteventname

  onConnect: () ->
    #if process.env.DEBUG_BBS_CONTROLLER=='1'
    console.log 'onConnect'
    @emit 'ctrl_ready'
    fn = () ->
      console.log 'start statusLight'
      @statusLight()
    setTimeout fn.bind(@), 2000



  ctrlSendCloseService: () ->

    message = new MSG2CUCLOSESERVICE
    sendbuffer = message.toFullByteArray()
    sizemessage = new MSG2CUPREPARESIZE
    sizemessage.setSize sendbuffer.length
    @client.write sizemessage.getBuffer()
    @client.write sendbuffer

  ctrlSendOpenService: (type) ->

    message = new MSG2CUOPENSERVICE
    message.setServiceID(type)
    sendbuffer = message.toFullByteArray()
    sizemessage = new MSG2CUPREPARESIZE
    sizemessage.setSize sendbuffer.length
    @client.write sizemessage.getBuffer()
    @client.write sendbuffer


  statusLight: () ->
    @once 'ctrl_message', (message) => @ctrlOnOpenService(message)
    @ctrlSendOpenService Message.SERVICE_STATUS_LIGHT

  ctrlOnOpenService: (message) ->
    if process.env.DEBUG_BBS_STATUS=='1'
      console.log message
    if message.type_of_message == Message.TYPE_ACK and message.serviceID == Message.SERVICE_STATUS_LIGHT
      @once 'ctrl_message', (message) => @ctrlOnGetStatusLight(message)
      if process.env.DEBUG_BBS_STATUS=='1'
        console.log('ctrlSendStatusLight')
      @ctrlSendStatusLight()

  ctrlOnGetStatusLight: (message) ->
    if process.env.DEBUG_BBS_STATUS=='1'
      console.log('onGetStatusLight',message,Message.TYPE_BBS_RETURN_STATUS_LIGHT)
    if message.type_of_message == Message.TYPE_BBS_RETURN_STATUS_LIGHT
      @message = message
      @once 'ctrl_message', (message) => @onCloseService(message)
      @ctrlSendCloseService()
    else
  #    @unexpected message


  ctrlSendStatusLight: () ->
    message = new MSG2CUGETSTATUSLIGHT
    sendbuffer = message.toFullByteArray()
    sizemessage = new MSG2CUPREPARESIZE
    sizemessage.setSize sendbuffer.length
    @client.write sizemessage.getBuffer()
    @client.write sendbuffer