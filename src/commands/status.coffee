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

Sequence = require '../Sequence/SeqStatus'

mixOf = (base, mixins...) ->
  class Mixed extends base
    for mixin in mixins by -1 #earlier mixins override later ones
      for name, method of mixin::
        Mixed::[name] = method
  Mixed

module.exports =
class Status extends mixOf Command,Sequence
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

