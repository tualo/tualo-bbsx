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
MSG2CUSTOPPRINTJOB = require '../FP/MSG2CUSTOPPRINTJOB'

Sequence = require '../Sequence/Seq'

mixOf = (base, mixins...) ->
  class Mixed extends base
    for mixin in mixins by -1 #earlier mixins override later ones
      for name, method of mixin::
        Mixed::[name] = method
  Mixed

module.exports =
class Stop extends mixOf Command,Sequence
  @commandName: 'stop'
  @commandArgs: [
      'ip',
      'port'
  ]

  @commandShortDescription: 'stop a print job'
  @options: []

  @help: () ->
    """

    """

  action: (options,args) ->
    @quiet = false
    if args.port
      @run args.ip,args.port,1

  sequence_message: new MSG2CUSTOPPRINTJOB
  open_service_id: Message.SERVICE_BBS_PRINTJOB
  service_return_type: Message.TYPE_BBS_STOP_PRINTJOB
