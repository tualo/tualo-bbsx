{Command} = require 'tualo-commander'
path = require 'path'
fs = require 'fs'
{spawn} = require 'child_process'
{EventEmitter} = require 'events'


mixOf = (base, mixins...) ->
  class Mixed extends base
    for mixin in mixins by -1 #earlier mixins override later ones
      for name, method of mixin::
        Mixed::[name] = method
  Mixed

module.exports =
class HSCTRL extends mixOf Command,EventEmitter
  @commandName: 'httpserver'
  @commandArgs: [
      'port',
      'machine_ip',
      'machine_port',
      'hostsystem',
      'hostdb',
      'dbuser',
      'dbpass',
      'jobfile'
  ]
  @commandShortDescription: 'running the bbs machine controll service'
  @options: []

  @help: () ->
    """

    """

  action: (options,args) ->
    if args.port
      @args = args
      #imprint = new bbs.Imprint()
      me = @
      me.waregroup = 'Standardsendungen'

      me.jobfile = args.jobfile||'/opt/grab/job.txt'
      if process.env.DEBUG_BBS_HTTPSERVER=='1'
        console.log @args

      @mysqlOpts =
        host     : @args.hostsystem
        user     : @args.dbuser
        password : @args.dbpass
        database :  @args.hostdb
        connectionLimit: 100
        wait_timeout: 120
        connect_timeout: 10
      # flush table bbs_data
      
      @emit 'start'