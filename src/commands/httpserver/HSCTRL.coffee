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
    @client.setTimeout 1100

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



  # ++++++++++ STATUS
  statusLight: () ->
    console.log 'get status light'
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
      console.log '####',message
      if message.print_job_active==0
        console.log '!!! start the job'
        fn = () ->
          console.log 'start startJob'
          @initStartJobMessage()
          @startJob()
        setTimeout fn.bind(@), 2000
      else
        console.log '!!! stop the job'
        fn = () ->
          console.log 'start stopJob'
          @stopJob()
        setTimeout fn.bind(@), 2000

      fn = () ->
        console.log 'start statusLight'
        @statusLight()
      setTimeout fn.bind(@), 2000
     # @once 'ctrl_message', (message) => @onCloseService(message)
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
    try
      console.log 'StartPrintjob setAdvertHex', val
      @start_message.setAdvert Buffer.from(val,'base64')
    catch e
      console.log 'StartPrintjob setAdvertHex error', val
      @start_message.setAdvert new Buffer(val,'base64')

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
    #if process.env.DEBUG_BBS_STARTJOB=='1'
    console.log 'StartPrintjob', 'onStartPrintJob', message
    if message.type_of_message == Message.TYPE_BBS_START_PRINTJOB
      if process.env.DEBUG_BBS_STARTJOB=='1'
        console.log 'StartPrintjob', 'TYPE_BBS_START_PRINTJOB', message
        console.log 'TYPE_BBS_START_PRINTJOB'
      @message = message
      #@once 'ctrl_message', (message) => @onCloseService(message)
      @ctrlSendCloseService()
      if process.env.DEBUG_BBS_STARTJOB=='1'
        console.log 'ok closing'
    else if message.type_of_message == Message.TYPE_ACK
      if process.env.DEBUG_BBS_STARTJOB=='1'
        console.log 'StartPrintjob', 'TYPE_ACK', message
        console.log 'TYPE_ACK'
      #@once 'ctrl_message', (message) => @onCloseService(message)
      @ctrlSendCloseService()
    else
      #if process.env.DEBUG_BBS_STARTJOB=='1'
      console.log 'StartPrintjob', 'something went wrong', message.type_of_message
      #@unexpected message
    #else
    #  @unexpected message
  # ------ START JOB
    

  # ++++++ STOP JOB
  stopJob: () ->
    
    @once 'ctrl_message', (message) => @ctrlOnOpenStopJobService(message)
    @ctrlSendOpenService Message.SERVICE_BBS_PRINTJOB

  ctrlOnOpenStopJobService: (message) ->
    #if process.env.DEBUG_BBS_STOPJOB=='1'
    console.log 'MSG2CUSTOPPRINTJOB','onOpenService',message.type_of_message,message.serviceID
    if message.type_of_message == Message.TYPE_ACK and message.serviceID == Message.SERVICE_BBS_PRINTJOB
      @once 'ctrl_message', (message) => @ctrlOnStopPrintJob(message)
      @ctrlSendStopPrintJob()
    else
      @unexpected message

  ctrlOnStopPrintJob: (message) ->
    if process.env.DEBUG_BBS_STOPJOB=='1'
      console.log 'MSG2CUSTOPPRINTJOB','onStopPrintJob',message,'Message.TYPE_BBS_STOP_PRINTJOB',Message.TYPE_BBS_STOP_PRINTJOB
    #if message.type_of_message == Message.TYPE_BBS_STOP_PRINTJOB
    @message = message
    #@once 'ctrl_message', (message) => @onCloseService(message)
    @sendCloseService()
    #else
    #  @unexpected message

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
