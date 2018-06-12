HSCMD = require './HSCMD'
Net = require 'net'

SeqStatus = require '../../Sequence/SeqStatus'


module.exports =
class HSCTRL extends HSCMD
  constructor: ->
    super()
    @serviceOpen = false
    @state = 0
    @lastState = null
    @statusLightIndex = 0
    @statusLightTimer = setInterval @statusLight.bind(@),1500
    #@on 'start', @initCtrlPort

  statusLight: () ->
    #console.log 'statusLight', @statusLightIndex++,@args.machine_ip,@args.machine_port
    seq = new SeqStatus()
    seq.quiet = true
    seq.on 'sequence_message', @onStatusMessage.bind(@)
    seq.on 'sequence_error', @onStatusError.bind(@)
    seq.on 'sequence_timeout', @onStatusTimeout.bind(@)
    seq.run @args.machine_ip,@args.machine_port,1


  onStatusMessage: (message) ->
    @lastError = null
    @lastState = message

  onStatusError: (err) ->
    console.log 'onStatusError', err.code
    @lastError = err

  onStatusTimeout: (err) ->
    console.log 'onStatusTimeout'
    @lastError = err
