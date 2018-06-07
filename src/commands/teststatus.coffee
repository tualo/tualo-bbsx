{Command} = require 'tualo-commander'
path = require 'path'
fs = require 'fs'
{spawn} = require 'child_process'
{EventEmitter} = require 'events'
Net = require 'net'

Status = require './Status'

module.exports =
class Teststatus extends Status
  @commandName: 'teststatus'