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

Sequence = require './Seq'

module.exports =
class SeqStatus extends Sequence

  sequence_message: new MSG2CUGETSTATUSLIGHT
  open_service_id: Message.SERVICE_STATUS_LIGHT
  service_return_type: Message.TYPE_BBS_RETURN_STATUS_LIGHT

