HSCTRL = require './HSCTRL'
mysql = require 'mysql'

module.exports =
class HSMYSQL extends HSCTRL
  constructor: ->
    super()
    @on 'start', @initMYSQL
    
  initMYSQL: () ->
    console.log "HSMYSQL", "initMYSQL"
    @pool = mysql.createPool @mysqlOpts
    @pool.on 'error', (err) => @onDBError

  onDBError: (err) ->
    if process.env.DEBUG_BBS_HTTPSERVER=='1'
      console.log '####################'
      console.log 'onDBError'
      console.trace err
    setTimeout process.exit, 5000