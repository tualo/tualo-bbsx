P = require './HSIMPRINT'
path = require 'path'
fs = require 'fs'

module.exports =
class HSEXPRESS extends P
  constructor: ->
    super()
    @on 'start', @initExpressServer

  initExpressServer: () ->
    console.log "HSEXPRESS", "initExpressServer"
    @openExpressServer()

  openExpressServer: () ->
    #@getStatusTimed()
    express = require('express')
    bodyParser = require('body-parser')
    app = express()
    app.use bodyParser.json()
    app.use bodyParser.urlencoded {extended: true}

    app.get '/', @expressPlain.bind(@)
    app.get '/status', @expressStatus.bind(@)
    app.all '/startjob', @expressStartJob.bind(@)
    app.get '/stopjob', @expressStopJob.bind(@)
    app.get '/restartimprint', @expressRestartImprint.bind(@)
    app.all '/hotswitch', @expressHotSwitch.bind(@)
    app.all '/reboot', @expressReboot.bind(@)
    app.listen @args.port,'0.0.0.0'

  expressPlain: (req, res) ->
    result = {success: true}

    if @start_without_printing_running == true
      result.machine_ip = @args.machine_ip
      result.machine_port = @args.machine_port
      result.lastimprint = @lastimprint
      result.jobCount = @jobCount
      result.lastError = @lastError
      result.lastState = @lastState
      result.lastState.print_job_active = 1
      result.lastSQLError=@lastSQLError
      result.lastStartJobMessage = @lastStartJobMessage
      res.send(JSON.stringify(result))
      return

    if @state==-1
      res.send(JSON.stringify({success: false,msg: "Keine Verbindung zur Maschine"}))
      return

    result.machine_ip = @args.machine_ip
    result.machine_port = @args.machine_port
    result.lastimprint = @lastimprint
    result.jobCount = @jobCount
    result.lastError = @lastError
    result.lastState = @lastState
    result.lastSQLError=@lastSQLError
    result.lastStartJobMessage = @lastStartJobMessage

    res.send(JSON.stringify(result))

  expressRestartImprint: (req, res) ->
    me = @
    console.log 'restartImprint','start'
    me.imprint.reopen()
    res.send(JSON.stringify({success: true,msg: 'imprint restarted'}))
    if process.env.DEBUG_BBS_HTTPSERVER=='1'
      console.log 'restartImprint','done'

  expressReboot: (req, res) ->
    me = @
    fn = () ->
      rebootProc = spawn 'reboot', []
    res.send(JSON.stringify({success: true,msg: "rebooting"}))
    setTimeout fn.bind(me), 3000

  expressStatus: (req, res) ->
    me = @
    if me.hasMachine
      res.send(JSON.stringify({success: false,msg: "Keine Verbindung zur Maschine"}))
      return
    if me.start_without_printing_running == true
      message = me.lastState
      message.print_job_active = 1
      message.print_job_id = 999999
      #
      #  available_scale: 3
      #  available_scale_text: "3: Static and dynamic scale"
      #  interface_of_message: 9
      #  print_job_active: 1
      #  print_job_id: 177086
      #  system_uid: 330
      if process.env.DEBUG_BBS_HTTPSERVER=='1'
        console.log 'start_without_printing_running','status',message

      res.send(JSON.stringify({success: true,msg: message}))
      return
    res.send(JSON.stringify({success: true,msg: me.lastState}))

  expressStopJob: (req, res) ->
    me = @
    message = {}
    if me.start_without_printing_running == true
      @currentJob ''
      @setCustomerFile ''
      me.start_without_printing_running = false
      res.send(JSON.stringify({success: true,msg: {} }))
      return
    @stopJob()
    res.send(JSON.stringify({success: true,msg: me.lastState}))

  expressHotSwitch: (req, res) ->
    me = @
    message = {}


    bodymessage = {}
    try
      bodymessage = JSON.parse(req.body.message)
      if process.env.DEBUG_BBS_HTTPSERVER=='1'
        console.log '########################'
        console.log '########################'
        console.log bodymessage
        console.log '########################'
        console.log '########################'
    catch e
      console.log e

    message = {
      job_id: 1,
      weight_mode: 3,
      customerNumber: '69000|0',
      kundennummer: '69000',
      kostenstelle: 0,
      waregroup: 'Standardsendungen',
      label_offset: 0,
      date_offset: 0,
      stamp: 1,
      addressfield: 'L',
      print_date: 1,
      print_endorsement: 1,
      endorsement1: 'endors',
      endorsement2: 'endors',
      advert: '02042a3d422a7b9884329e0df9000000006a0000000000000000000000b93c00000000000000002102220100000000000000000000000000002c00000039004d00ffffffffffffffff0b0057657262756e672d3034001200f3fb07f3f12a03f6f3fbfff3fbfff3fb16f502072a3d422a7b9884c6a899bb00000000120000000000000000000000'
    }

    for k,v of message
      if bodymessage.hasOwnProperty(k)
        message[k]=bodymessage[k]
    #message.advert="AgQqPUIqe5iEMp4N+QAAAABqAAAAAAAAAAAAAAC5PAAAAAAAAAAAIQIiAQAAAAAAAAAAAAAAAAAALAAAADkATQD//////////wsAV2VyYnVuZy0wNAASAPP7B/PxKgP28/v/8/v/8/sW9QIHKj1CKnuYhMaombsAAAAAEgAAAAAAAAAAAAAA"
    me.lastStartJobMessage = message

    me.currentJob message.job_id
    me.setCustomerFile message.customerNumber
    me.customerNumber = message.customerNumber
    me.jobCount = 0
    res.send(JSON.stringify({success: true,msg: message}))


  expressStartJob: (req, res) ->
    me = @
    try
      if me.lastState.print_job_active==1
        res.send(JSON.stringify({success: false,msg: "Es wird bereits ein Druckauftrag ausgeführt"}))
      else
        bodymessage = {}
        try
          bodymessage = JSON.parse(req.body.message)
          if process.env.DEBUG_BBS_HTTPSERVER=='1'
            console.log '########################'
            console.log '########################'
            console.log bodymessage
            console.log '########################'
            console.log '########################'
        catch e
          console.log e

        message = {
          job_id: 1,
          weight_mode: 3,
          customerNumber: '69000|0',
          kundennummer: '69000',
          kostenstelle: 0,
          waregroup: 'Standardsendungen',
          label_offset: 0,
          date_offset: 0,
          stamp: 1,
          addressfield: 'L',
          print_date: 1,
          print_endorsement: 1,
          endorsement1: 'endors',
          endorsement2: 'endors',
          advert: '02042a3d422a7b9884329e0df9000000006a0000000000000000000000b93c00000000000000002102220100000000000000000000000000002c00000039004d00ffffffffffffffff0b0057657262756e672d3034001200f3fb07f3f12a03f6f3fbfff3fbfff3fb16f502072a3d422a7b9884c6a899bb00000000120000000000000000000000'
        }

        if bodymessage.hasOwnProperty('start_without_printing')
          if bodymessage.start_without_printing*1==1
            me.start_without_printing_running = true
            me.currentJob message.job_id
            me.setCustomerFile message.customerNumber
            res.send(JSON.stringify({success: true,msg: 'Nur Transportieren kann einstellt werden.'}))
            return

        for k,v of message
          if bodymessage.hasOwnProperty(k)
            message[k]=bodymessage[k]
        #message.advert="AgQqPUIqe5iEMp4N+QAAAABqAAAAAAAAAAAAAAC5PAAAAAAAAAAAIQIiAQAAAAAAAAAAAAAAAAAALAAAADkATQD//////////wsAV2VyYnVuZy0wNAASAPP7B/PxKgP28/v/8/v/8/sW9QIHKj1CKnuYhMaombsAAAAAEgAAAAAAAAAAAAAA"
        me.lastStartJobMessage = message

        @initStartJobMessage()

        me.job_id = message.job_id
        if typeof message.addressfield=='string'
          me.addressfield = message.addressfield
        me.setJobId(message.job_id)
        me.setWeightMode(message.weight_mode)
        me.customerNumber = message.customerNumber
        me.setCustomerNumber(message.customerNumber)
        if message.waregroup?
          me.waregroup = message.waregroup
        me.setPrintOffset(message.label_offset)
        me.setDateAhead(message.date_offset)
        me.setPrintDate(message.print_date)
        me.setPrintEndorsement(message.print_endorsement)
        endorsement1 = ''
        if message.endorsement1
          endorsement1 = message.endorsement1
        endorsement2 = ''
        if message.endorsement2
          endorsement2 = message.endorsement2
        adv = ''
        if message.advert
          if message.advert.length>30
            adv = message.advert
        me.setEndorsementText1(endorsement1)
        me.setEndorsementText2(endorsement2)
        if adv.length>30
          me.setAdvertHex adv

        me.setImprintChannelPort(me.imprint.getPort())
        me.setImprintChannelIP(me.imprint.getIP())
        me.startJob()
    catch e
      res.send(JSON.stringify({success: false,msg: e.message}))



  currentJob: (job) ->
    @currentJobID = job
    if process.env.DEBUG_BBS_HTTPSERVER=='1'
      console.log('set job: ',job)
    fs.writeFile @jobfile, job, (err) ->
      if err
        throw err



  setCustomerFile: (kn) ->
    fs.exists '/opt/grab/customer.txt',(exists)->
      if exists
        fs.writeFile '/opt/grab/customer.txt', kn, (err) ->
          if err
            console.log err
