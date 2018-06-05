HSCMD = require './HSCMD'
Net = require 'net'


Message = require '../../FP/Message'
MessageWrapper = require '../../FP/MessageWrapper'

MSG2DCACK = require '../../FP/MSG2DCACK'
MSG2CUOPENSERVICE = require '../../FP/MSG2CUOPENSERVICE'
MSG2CUCLOSESERVICE = require '../../FP/MSG2CUCLOSESERVICE'
MSG2CUPREPARESIZE = require '../../FP/MSG2CUPREPARESIZE'
MSG2CUGETSTATUSLIGHT = require '../../FP/MSG2CUGETSTATUSLIGHT'

MSG2CUSTARTPRINTJOB = require '../../FP/MSG2CUSTARTPRINTJOB'
MSG2CUSTOPPRINTJOB = require '../../FP/MSG2CUSTOPPRINTJOB'



module.exports =
class HSCTRL extends HSCMD
  constructor: ->
    super()
    @serviceOpen = false
    @state = 0
    @lastState = null
    @statusLightTimer = setInterval @statusLight.bind(@),2500
    #@on 'start', @initCtrlPort
    
  initCtrlPort: () ->
    me = @
    console.log "HSCTRL", "initCtrlPort"
    fn = () ->
      clearTimeout me.ctrlConnectionTimeout
      if me.client.connecting
        me.client.destroy()
        console.log 'CTRL','connection timeout'
        me.emit 'ctrl_timeout', {msg:'socket timeout',code:'ETIMEDOUT',address:me.ip}
        me.state = -1
        #setTimeout me.initCtrlPort.bind(me),500

    @ctrlConnectionTimeout = setTimeout fn,900
    if @client
      @client.removeAllListeners()

    @client = Net.createConnection @args.machine_port, @args.machine_ip, () => @onConnect()
    @client.on 'timeout', (err) ->
      if process.env.DEBUG_BBS_CONTROLLER=='1'
        console.log 'controller socket timeout'
        me.state = -1
      me.emit 'ctrl_timeout', {msg:'socket timeout',code:'ETIMEDOUT',address:me.ip}
    @client.on 'error', (err) ->
      if err.code=='EADDRNOTAVAIL'
        console.error 'HSCTRL','machine offline'
        me.emit 'ctrl_offline', 'machine offline'
      else if err.code=='ECONNREFUSED'
        console.error 'HSCTRL','machine offline refused'
        me.emit 'ctrl_offline', 'machine offline'
      else
        console.error 'HSCTRL','error','des',        me.client.destroyed
        console.trace err
        me.emit 'ctrl_error', err
      me.state = -1
      #if me.client.destroyed
      #  setTimeout me.initCtrlPort.bind(me),500
    @client.setNoDelay true
    @client.on 'close', () => @onClose()
    @client.on 'end', () => @onEnd()
    @client.on 'data', (data) => @onData(data)
    
    if process.env.DEBUG_BBS_CONTROLLER=='1'
      console.log '-----'

  onData: (data) ->
    #@currentDatas.push data
    hex = data.toString('hex')
    console.log 'HSCTRL','onData',hex
    message = MessageWrapper.getMessageObject data
    console.log 'HSCTRL','onData',message
    if message.type_of_message == Message.TYPE_PREPARE_SIZE
      buf = Buffer.from hex.substr(20),'hex'
      console.log 'HSCTRL','TYPE_PREPARE_SIZE',hex.substr(20), buf
      if buf.length>0
        message = MessageWrapper.getMessageObject buf
        console.log 'HSCTRL','>>>>>>',message
        @emit 'ctrl_message', message
    else
      @emit 'ctrl_message', message
    

  onClose: () ->
    console.log 'HSCTRL','onClose'

  onEnd: () ->
    console.log 'HSCTRL','onEnd'

  onConnect: () ->
    @serviceOpen = false
    clearTimeout @ctrlConnectionTimeout
    console.log 'onConnect'
    @state = 1
    @emit 'ctrl_ready'



  ctrlSendCloseService: () ->
    message = new MSG2CUCLOSESERVICE
    sendbuffer = message.toFullByteArray()
    sizemessage = new MSG2CUPREPARESIZE
    sizemessage.setSize sendbuffer.length
    @client.write sizemessage.getBuffer()
    @client.write sendbuffer
    @serviceOpen=false
    @emit 'ctrl_closeservice'


  ctrlSendOpenService: (type) ->
    if @serviceOpen==true
      throw Error('service is allready opened')
    message = new MSG2CUOPENSERVICE
    message.setServiceID(type)

    sendbuffer = message.toFullByteArray()
    sizemessage = new MSG2CUPREPARESIZE
    sizemessage.setSize sendbuffer.length
    @client.write sizemessage.getBuffer()
    @client.write sendbuffer

    @serviceOpen=true


  # ++++++++++ STATUS
  statusLight: () ->
    @removeAllListeners 'ctrl_ready'
    @removeAllListeners 'ctrl_closeservice'

    @once 'ctrl_ready', () =>
      console.log 'get status _statusLight'
      @_statusLight()

    @once 'ctrl_closeservice', () =>
      console.log 'get status ctrl_closeservice'
      @client.end()
    @initCtrlPort()

  _statusLight: () ->
    clearTimeout @statusTimer
    if @client.destroyed==true
      return
    if @serviceOpen==true
      console.log 'get status light DEFERED'
      @statusTimer = setTimeout @statusLight.bind(@), 100
    else
      console.log 'get status light'
      @once 'ctrl_message', (message) => @ctrlOnOpenService(message)
      @ctrlSendOpenService Message.SERVICE_STATUS_LIGHT

  ctrlOnOpenService: (message) ->
    console.log 'ctrlOnOpenService', message,  Message.SERVICE_STATUS_LIGHT, Message.TYPE_ACK
    if message.type_of_message == Message.TYPE_ACK and message.serviceID == Message.SERVICE_STATUS_LIGHT
      @once 'ctrl_message', (message) => @ctrlOnGetStatusLight(message)
      console.log 'ctrlSendStatusLight'
      @ctrlSendStatusLight()

  ctrlOnGetStatusLight: (message) ->
    console.log('onGetStatusLight',message,Message.TYPE_BBS_RETURN_STATUS_LIGHT)
    if message.type_of_message == Message.TYPE_BBS_RETURN_STATUS_LIGHT
      @lastState = message
      console.log 'ctrlOnGetStatusLight', message
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
  # ------ STATUS




  # ++++++ START JOB
  setJobId: (val) ->
    @start_message.setJobId parseInt(val)
  setCustomerId: (val) ->
    @start_message.setCustomerId parseInt(val)
  setPrintDate: (val) ->
    @start_message.setPrintDate parseInt(val)
  setDateAhead: (val) ->
    @start_message.setDateAhead parseInt(val)
  setWeightMode: (val) ->
    @start_message.setWeightMode parseInt(val)
  setPrintOffset: (val) ->
    @start_message.setPrintOffset parseInt(val)
  setImageId: (val) ->
    @start_message.setImageId parseInt(val)
  setPrintEndorsement: (val) ->
    @start_message.setPrintEndorsement parseInt(val)
  setEndorsementID: (val) ->
    @start_message.setEndorsementID parseInt(val)
  setEndorsementText1: (val) ->
    @start_message.setEndorsementText1 val
  setEndorsementText2: (val) ->
    @start_message.setEndorsementText2 val
  setAdvert: (val) ->
    @start_message.setAdvert val
  setAdvertHex: (val) ->
  
    #try
    #  console.log 'StartPrintjob setAdvertHex', val
    #  @start_message.setAdvert Buffer.from(val,'base64')
    #catch e
    #  console.log 'StartPrintjob setAdvertHex error', val
    #  @start_message.setAdvert new Buffer(val,'base64')

  setTownCircleID: (val) ->
    @start_message.setTownCircleID parseInt(val)
  setTownCircle: (val) ->
    @start_message.setTownCircle val
  setCustomerNumber: (val) ->
    @start_message.setCustomerNumber val
  setImprintChannelIP: (val) ->
    @start_message.setImprintChannelIP val
  setImprintChannelPort: (val) ->
    @start_message.setImprintChannelPort parseInt(val)


  initStartJobMessage: () ->
    if process.env.DEBUG_BBS_STARTJOB=='1'
      console.log 'StartPrintjob', 'init'
    @start_message = new MSG2CUSTARTPRINTJOB
  
  ctrlSendStartPrintJob: () ->
    if process.env.DEBUG_BBS_STARTJOB=='1'
      console.log "start message>",@start_message
    sendbuffer = @start_message.toFullByteArray()
    sizemessage = new MSG2CUPREPARESIZE
    sizemessage.setSize sendbuffer.length
    if process.env.DEBUG_BBS_STARTJOB=='1'
      console.log "sizemessage> ", sizemessage.getBuffer().toString('hex')
    @client.write sizemessage.getBuffer()

    if process.env.DEBUG_BBS_STARTJOB=='1'
      console.log "sendbuffer> ", sendbuffer.toString('hex')
      console.log "image> ", @start_message.advert.toString('hex')
      console.log "image> ", @start_message.advert.toString('base64')
    @client.write sendbuffer

  startJob: () ->
    @removeAllListeners 'ctrl_ready'
    @removeAllListeners 'ctrl_closeservice'
    
    @once 'ctrl_ready', () =>
      console.log 'get start _startJob'
      @_startJob()
    @once 'ctrl_closeservice', () =>
      console.log 'get start ctrl_closeservice'
      @client.end()
    @initCtrlPort()

  _startJob: () ->
    if @serviceOpen==true
      console.log 'startJob DEFERED'
      setTimeout @startJob.bind(@), 500
    else
      @once 'ctrl_message', (message) => @ctrlOnOpenStartJobService(message)
      @ctrlSendOpenService Message.SERVICE_BBS_PRINTJOB

  ctrlOnOpenStartJobService: (message) ->
    if process.env.DEBUG_BBS_STATUS=='1'
      console.log message
    if message.type_of_message == Message.TYPE_ACK and message.serviceID == Message.SERVICE_BBS_PRINTJOB
      @once 'ctrl_message', (message) => @ctrlOnStartPrintJob(message)
      if process.env.DEBUG_BBS_STATUS=='1'
        console.log('ctrlSendStatusLight')
      @ctrlSendStartPrintJob()

  ctrlOnStartPrintJob: (message) ->
    console.log 'StartPrintjob', 'onStartPrintJob', message
    if message.type_of_message == Message.TYPE_BBS_START_PRINTJOB
      if process.env.DEBUG_BBS_STARTJOB=='1'
        console.log 'StartPrintjob', 'TYPE_BBS_START_PRINTJOB', message
        console.log 'TYPE_BBS_START_PRINTJOB'
      @ctrlSendCloseService()
      if process.env.DEBUG_BBS_STARTJOB=='1'
        console.log 'ok closing'
    else if message.type_of_message == Message.TYPE_ACK
      if process.env.DEBUG_BBS_STARTJOB=='1'
        console.log 'StartPrintjob', 'TYPE_ACK', message
        console.log 'TYPE_ACK'
      @ctrlSendCloseService()
    else
      console.log 'StartPrintjob', 'something went wrong', message.type_of_message
  # ------ START JOB
    

  # ++++++ STOP JOB

  stopJob: () ->
    @removeAllListeners 'ctrl_ready'
    @removeAllListeners 'ctrl_closeservice'
    
    @once 'ctrl_ready', () =>
      console.log 'get stop _stopJob'
      @_stopJob()
    @once 'ctrl_closeservice', () =>
      console.log 'get stop ctrl_closeservice'
      @client.end()
    @initCtrlPort()

  _stopJob: () ->
    if @serviceOpen==true
      console.log 'stopJob DEFERED'
      setTimeout @stopJob.bind(@), 100
    else
      @once 'ctrl_message', (message) => @ctrlOnOpenStopJobService(message)
      @ctrlSendOpenService Message.SERVICE_BBS_PRINTJOB

  ctrlOnOpenStopJobService: (message) ->
    console.log 'MSG2CUSTOPPRINTJOB','onOpenService',message.type_of_message,message.serviceID
    if message.type_of_message == Message.TYPE_ACK and message.serviceID == Message.SERVICE_BBS_PRINTJOB
      @once 'ctrl_message', (message) => @ctrlOnStopPrintJob(message)
      @ctrlSendStopPrintJob()
    else
      @unexpected message

  ctrlOnStopPrintJob: (message) ->
    if process.env.DEBUG_BBS_STOPJOB=='1'
      console.log 'MSG2CUSTOPPRINTJOB','onStopPrintJob',message,'Message.TYPE_BBS_STOP_PRINTJOB',Message.TYPE_BBS_STOP_PRINTJOB
    @ctrlSendCloseService()

  ctrlSendStopPrintJob: () ->
    if process.env.DEBUG_BBS_STOPJOB=='1'
      console.log 'MSG2CUSTOPPRINTJOB','stopPrintJob'
    stop_message = new MSG2CUSTOPPRINTJOB
    sendbuffer = stop_message.toFullByteArray()
    sizemessage = new MSG2CUPREPARESIZE
    sizemessage.setSize sendbuffer.length
    @client.write sizemessage.getBuffer()
    @client.write sendbuffer
  # ------ STOP JOB
