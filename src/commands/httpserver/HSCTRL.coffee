HSCMD = require './HSCMD'
Net = require 'net'


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

  onData: () ->
    console.log 'HSCTRL','onData',data

  onClose: () ->
    @emit "ctrl_closed",@lasteventname

  onEnd: () ->
    @emit "ctrl_end",@lasteventname

  onConnect: () ->
    #if process.env.DEBUG_BBS_CONTROLLER=='1'
    console.log 'onConnect'
    @emit 'ctrl_ready'