{Command} = require 'tualo-commander'
path = require 'path'
fs = require 'fs'
{spawn} = require 'child_process'
{EventEmitter} = require 'events'
Net = require 'net'

Message = require '../FP/Message'
MessageWrapper = require '../FP/MessageWrapper'
MSG2DCACK = require '../FP/MSG2DCACK'
MSG2CUOPENSERVICE = require '../FP/MSG2CUOPENSERVICE'
MSG2CUCLOSESERVICE = require '../FP/MSG2CUCLOSESERVICE'
MSG2CUPREPARESIZE = require '../FP/MSG2CUPREPARESIZE'
MSG2CUGETSTATUSLIGHT = require '../FP/MSG2CUGETSTATUSLIGHT'

mixOf = (base, mixins...) ->
  class Mixed extends base
    for mixin in mixins by -1 #earlier mixins override later ones
      for name, method of mixin::
        Mixed::[name] = method
  Mixed

module.exports =
class Status extends mixOf Command,EventEmitter
  @commandName: 'status'
  @commandArgs: [
      'ip',
      'port',
      'repeat'
  ]

  @commandShortDescription: 'running the bbs machine controll service'
  @options: []

  @help: () ->
    """

    """

  action: (options,args) ->
    @quiet = false
    if args.port
      @run args.ip,args.port,args.repeat*1

  run: (ip,port,repeat) ->
    @args =
      ip: ip
      port: port
      repeat: repeat


    if @args.repeat>0
      @client = Net.createConnection @args.port, @args.ip, @onConnect.bind(@)
      @client.setTimeout 500
      @client.setNoDelay true
      @client.on 'close', @onClose.bind(@)
      @client.on 'end', @onEnd.bind(@)
      @client.on 'data', @onData.bind(@)
      @client.on 'error', @onError.bind(@)
      @client.on 'timeout', @onTimeout.bind(@)

  onConnect: () ->
    if @quiet==false
      console.info 'onConnect', @args
    @emit 'connected'
    @openService()

  openService: () ->
    @isOpenService = true
    message = new MSG2CUOPENSERVICE
    message.setServiceID(Message.SERVICE_STATUS_LIGHT)
    sendbuffer = message.toFullByteArray()
    sizemessage = new MSG2CUPREPARESIZE
    sizemessage.setSize sendbuffer.length
    @client.write sizemessage.getBuffer()
    @client.write sendbuffer
    if @quiet==false
      console.info '>>>>>>', sendbuffer
    @emit 'open_service'

  closeService: () ->
    message = new MSG2CUCLOSESERVICE
    sendbuffer = message.toFullByteArray()
    sizemessage = new MSG2CUPREPARESIZE
    sizemessage.setSize sendbuffer.length
    @client.write sizemessage.getBuffer()
    @client.write sendbuffer
    if @quiet==false
      console.info '>>>>>>', sendbuffer
    @emit 'close_service'

  sendService: () ->
    message = new MSG2CUGETSTATUSLIGHT
    sendbuffer = message.toFullByteArray()
    sizemessage = new MSG2CUPREPARESIZE
    sizemessage.setSize sendbuffer.length
    @client.write sizemessage.getBuffer()
    @client.write sendbuffer
    if @quiet==false
      console.info '>>>>>>', sendbuffer
    @emit 'send_service'


  onData: (data) ->
    hex = data.toString('hex')
    # console.log 'HSCTRL','onData',hex
    message = MessageWrapper.getMessageObject data
    if (message.interface_of_message==5 and message.type_of_message == 1) or (message.type_of_message == Message.TYPE_PREPARE_SIZE)
      buf = Buffer.from hex.substr(20),'hex'
      if buf.length>0
        message = MessageWrapper.getMessageObject buf
      else
        # only the length message is there
        # nothing to do
        return
    
    if message.interface_of_message == Message.INTERFACE_SO and message.type_of_message == Message.TYPE_NAK
      # message was not accepted
      # to do
      if @quiet==false
        console.error 'HSCTRL','onData','Message.TYPE_NAK',message
    else if message.interface_of_message == Message.INTERFACE_SO and message.type_of_message == Message.TYPE_ACK
      if message.serviceID == Message.SERVICE_STATUS_LIGHT and @isOpenService == true
        #open service is ok
        @isOpenService = false
        @sendService()
      else if (message.serviceID == Message.SERVICE_STATUS_LIGHT and @isOpenService == false) or (message.serviceID == 0 and @isOpenService == false)
        console.error 'HSCTRL','onData','OK WE ARE DONE!'
        @client.end()
      else
        # message was not expected here
        # to do
        if @quiet==false
          console.error 'HSCTRL','onData','FAIL',message
    else if message.interface_of_message == Message.INTERFACE_DI and message.type_of_message == Message.TYPE_BBS_RETURN_STATUS_LIGHT
      console.info 'HSCTRL','onData','OK',message
      # ok status message received
      # closing the service sequence
      @last_message = message
      @emit 'sequence_message', message
      @closeService()
    else
      # message was not expected here
      # to do
      if @quiet==false
        console.error 'HSCTRL','onData','FAIL','message was not expected here',message,Message.TYPE_ACK,Message.TYPE_BBS_RETURN_STATUS_LIGHT



  onEnd: (data) ->
    if @quiet==false
      console.error 'HSCTRL','onEnd',data

  onClose: () ->
    if @quiet==false
      console.error 'HSCTRL','onClose',new Date(),@args
    @emit 'sequence_complete', @last_message
    @args.repeat--
    fn = () ->
      @run @args.ip,@args.port,@args.repeat
    setTimeout fn.bind(@),1000
  
  onTimeout: () ->
    @emit 'sequence_timeout'
    @client.end()
    if @quiet==false
      console.error 'HSCTRL','onTimeout * ',@client

  onError: (err) ->
    @emit 'sequence_error'
    @client.end()
    if @quiet==false
      console.error 'HSCTRL','onError'
    if err.code=='EADDRNOTAVAIL'
      if @quiet==false
        console.error 'HSCTRL','machine offline EADDRNOTAVAIL'
    else if err.code=='ECONNREFUSED'
      if @quiet==false
        console.error 'HSCTRL','machine offline ECONNREFUSED'
    else
      if @quiet==false
        console.error 'HSCTRL','error','des', @client.destroyed
      #console.trace err
    