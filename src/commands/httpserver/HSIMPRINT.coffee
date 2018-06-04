HSMYSQL = require './HSMYSQL'
Imprint = require '../../Service/Imprint'

module.exports =
class HSIMPRINT extends HSMYSQL
  constructor: ->
    super()
    @on 'start', @initImprint
    
  initImprint: () ->
    console.log "HSIMPRINT", "initImprint", @args
    @imprint=null
    if @args.machine_ip!='0'
      @imprint = new Imprint @args.machine_ip
      @imprint.on 'imprint', @onImprint.bind(@)
      @imprint.open()

  onImprint: (imprint) ->
    imprint.job_id = @currentJobID
    @lastimprint=imprint
    @lastimprinttime=(new Date()).getTime()
    message=imprint
    @jobCount+=1
    me = @
    sql = '''
    insert into bbs_data
    (
      id,
      kundennummer,
      kostenstelle,
      height,
      length,
      thickness,
      weight,
      inserttime,
      job_id,
      machine_no,
      login,
      waregroup,
      addressfield
    ) values (
      {id},
      {kundennummer},
      {kostenstelle},
      {height},
      {length},
      {thickness},
      {weight},
      now(),
      {job_id},
      {machine_no},
      '{login}',
      '{waregroup}',
      '{addressfield}'
    )
    on duplicate key update
      kundennummer=values(kundennummer),
      kostenstelle=values(kostenstelle),
      height=values(height),
      length=values(length),
      thickness=values(thickness),
      weight=values(weight),
      inserttime=values(inserttime),
      job_id=values(job_id),
      machine_no=values(machine_no),
      login=values(login),
      waregroup=values(waregroup),
      addressfield=values(addressfield)
    '''
    cp = me.customerNumber.split '|'

    sql  = sql.replace('{id}',message.machine_no*100000000+message.imprint_no)

    sql  = sql.replace('{kundennummer}', cp[0])
    sql  = sql.replace('{kostenstelle}', cp[1])

    sql  = sql.replace('{height}',message.mail_height)
    sql  = sql.replace('{length}',message.mail_length)
    sql  = sql.replace('{thickness}',message.mail_thickness)
    sql  = sql.replace('{weight}',message.mail_weight)

    sql  = sql.replace('{job_id}',message.job_id)
    sql  = sql.replace('{machine_no}',message.machine_no)
    sql  = sql.replace('{waregroup}',me.waregroup)
    sql  = sql.replace('{addressfield}',me.addressfield)

    sql  = sql.replace('{login}','sorter')


    fn = (err, connection) ->
      me.lastSQLError=null
      if err
        if process.env.DEBUG_BBS_HTTPSERVER=='1'
          console.log 'ERROR on MYSQL Connection'
        console.trace err
        me.lastSQLError = err.message
        errorFN = (errMessage) =>
          if process.env.DEBUG_BBS_HTTPSERVER=='1'
            console.log 'stopJob','errorFN',errMessage
        closeFN = (message) =>
          me.currentJob ''
          if process.env.DEBUG_BBS_HTTPSERVER=='1'
            console.log 'stopJob','closeFN', 'on MYSQL Connection'
        doneFN = (message) =>
          me.currentJob ''
          if process.env.DEBUG_BBS_HTTPSERVER=='1'
            console.log 'stopJob','doneFN', 'on MYSQL Connection'
        me.controller 'getStopPrintjob',closeFN,doneFN,errorFN
      else
        if process.env.DEBUG_BBS_HTTPSERVER=='1'
          console.log 'write db'
        connection.query sql, (err, rows, fields) ->
          me.lastSQLError=null
          if process.env.DEBUG_BBS_HTTPSERVER=='1'
            console.log 'write db returned'
          if err
            me.lastSQLError = err.message
            if process.env.DEBUG_BBS_HTTPSERVER=='1'
              console.trace err
            if err.code!='ER_DUP_KEY'
              errorFN = (errMessage) =>
                if process.env.DEBUG_BBS_HTTPSERVER=='1'
                  console.log 'stopJob','errorFN',errMessage
              closeFN = (message) =>
                me.currentJob ''
                if process.env.DEBUG_BBS_HTTPSERVER=='1'
                  console.log 'stopJob','closeFN', 'db write error'
              doneFN = (message) =>
                me.currentJob ''
                if process.env.DEBUG_BBS_HTTPSERVER=='1'
                  console.log 'stopJob','doneFN', 'db write error'
              me.controller 'getStopPrintjob',closeFN,doneFN,errorFN
          connection.release()

    me.pool.getConnection fn
    if process.env.DEBUG_BBS_HTTPSERVER=='1'
      console.log 'imprint--------------',imprint