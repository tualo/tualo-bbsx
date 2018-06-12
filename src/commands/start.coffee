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
MSG2CUSTARTPRINTJOB = require '../FP/MSG2CUSTARTPRINTJOB'
Imprint = require '../Service/Imprint'

Sequence = require '../Sequence/Seq'

mixOf = (base, mixins...) ->
  class Mixed extends base
    for mixin in mixins by -1 #earlier mixins override later ones
      for name, method of mixin::
        Mixed::[name] = method
  Mixed

module.exports =
class Start extends mixOf Command,Sequence
  @commandName: 'start'
  @commandArgs: [
      'ip',
      'port'
  ]

  @commandShortDescription: 'start a print job'
  @options: []

  @help: () ->
    """

    """

  action: (options,args) ->
    @quiet = false
    if args.port
      @imprint=null
      if args.ip!='0'
        @imprint = new Imprint args.ip
        @imprint.on 'imprint', @onImprint.bind(@)
        @imprint.open()
        @args = args
        setTimeout @deferedRun.bind(@), 1000

  sequence_message: new MSG2CUSTARTPRINTJOB
  open_service_id: Message.SERVICE_BBS_PRINTJOB
  service_return_type: Message.TYPE_BBS_START_PRINTJOB

  deferedRun: () ->
    args = @args
    console.log(@,@sequence_message,@run,Start)
    @message().setImprintChannelPort(@imprint.getPort())
    @message().setImprintChannelIP(@imprint.getIP())
    @run args.ip,args.port,1

  onImprint: (message) ->
    console.log( message.machine_no*100000000+message.imprint_no )

