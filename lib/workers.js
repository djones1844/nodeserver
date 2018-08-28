/*
 * worker related tasks
 * 
 */


const path = require('path')
const fs = require('fs')
const _data = require('./data')
const https = require('https')
const http = require('http')
const helpers = require('./helpers')
const url = require('url')
const _logs = require('./logs')
const util = require('util')
const debug = util.debuglog('workers')

// instantiate the worker object
let workers = {}

 // Lookup all checks, get their data, and send it to validator
workers.gatherAllChecks = () => {
  // lookup all the checks 
  _data.list('checks',(err, checks) => {
    if(!err && checks && checks.length >0){
      checks.forEach( check => {
        _data.read('checks', check, (err, originalCheckData) => {
          if(!err && originalCheckData){
            // Pass it to the check validator and let that function continue or log errors as needed
            workers.validateCheckData(originalCheckData)
          } else {
            debug("Error reading one of the check's data")
          }
        }) 
      })
    } else {
      debug("Error: Could not find any checks to process")
    }
  })
}

// Sanity-check the check-data
workers.validateCheckData = originalCheckData => {
  originalCheckData = typeof(originalCheckData) == 'object' &&  originalCheckData != null ? originalCheckData : {}
  originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false 
  originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim() : false 
  originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false 
  originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false 
  originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false 
  originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0  ? originalCheckData.successCodes : false 
  originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds > 0 && originalCheckData.timeoutSeconds < 6 && originalCheckData.timeoutSeconds % 1 === 0 ? originalCheckData.timeoutSeconds : false 
 
  // set the keys that my not have been set in the past
  originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down'
  originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false 
  
  // if all the checks pass, pass the data along to the next step in the process
  if(originalCheckData.id &&
  originalCheckData.userPhone &&
  originalCheckData.protocol &&
  originalCheckData.url &&
  originalCheckData.method &&
  originalCheckData.successCodes &&
  originalCheckData.timeoutSeconds){
    workers.performCheck(originalCheckData)
  } else {
      debug('Error: One of the checks is not properly formated')
  }
}

// Perform the check, send the originalCheckData and outcome of the check process to the next step
workers.performCheck = originalCheckData => {
  // prepare the initial check outcome
  let checkOutcome = {
    'error' : false,
    'responseCode' : false
  }

  // mark that the outcome has not been set yet
  let outcomeSent = false

  // Parse the hostname and the path out of the original check data
  let parsedUrl = url.parse(originalCheckData.protocol+'://'+originalCheckData.url, true)
  let hostName = parsedUrl.hostname
  let path = parsedUrl.path // using path instead of pathname as we need the query string

  // construct the request
  let requestDetails = {
    'protocol' : originalCheckData.protocol+':',
    'hostname' : 'hostname',
    'method' : originalCheckData.method.toUpperCase(),
    'path' : path,
    'timeout' : originalCheckData.timeoutSeconds * 1000
  }

  // Instantiate the request object (using either http or https module)
  let _moduleToUse = originalCheckData.protocol == 'http' ? http : https
  let req = _moduleToUse.request(requestDetails, res => {
    // Grab the status of the sent request
    let status = res.status

    // update the checkOutcome and pass the data along
    checkOutcome.responseCode = status
    if(!outcomeSent){
      workers.processCheckOutcome(originalCheckData, checkOutcome)
      outcomeSent = true
    }
  })

  // bind to the error so it doesn't get thrown
  req.on('error', e =>{
    // update the checkOutcome and pass the data along
    checkOutcome.error = {
      'error': true,
      'value': e
    }
    if(!outcomeSent){
      workers.processCheckOutcome(originalCheckData, checkOutcome)
      outcomeSent = true
    }
  })

  // bind to the timeout so it doesn't throw an error
  req.on('timeout', e =>{
    // update the checkOutcome and pass the data along
    checkOutcome.error = {
      'error': true,
      'value': 'timeout'
    }
    if(!outcomeSent){
      workers.processCheckOutcome(originalCheckData, checkOutcome)
      outcomeSent = true
    }
  })

  // End the request
  req.end()

}

// Process the check outcome, update the check data as needed, and trigger an alert to the user if needed
// Special logic for checks that have never be tested
workers.processCheckOutcome = (originalCheckData, checkOutcome) => {
  // decide if the check's state is up or down 
  let state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down'

  // decide if an alert is required
  let alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false
  
  // Log the outcome
  let timeOfCheck = Date.now()
  workers.log(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck)

  // update the check data
  let newCheckData = originalCheckData
  newCheckData.state = state
  newCheckData.lastChecked = timeOfCheck


  // save the updates to check
  _data.update('checks', newCheckData.id, newCheckData, err => {
    if(!err){
      // Send the new check data to the next phase in the process as needed
      if(alertWarranted){
        workers.alertUsersToStatusChange(newCheckData)
      } else {
        debug('Check outcome has not changed, no alert needed')
      }

    } else {
      debug("Error trying to update one of the checks")
    }
  })
}

// alert users of the new change in state
workers.alertUsersToStatusChange = newCheckData => {
  let msg = 'Alert: Your check for '+newCheckData.method.toUpperCase()+' '+newCheckData.protocol+'://'+newCheckData.url+' is currently '+newCheckData.state
  helpers.sendTwilioSms(newCheckData.userPhone, msg, err => {
    if (!err){
      debug('Success: User was alerted to a status change in their check, via sms')
    } else {
      debug('Error: Could not send sms alert to a person who had a state change')
    }
  })
}


workers.log = (originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck) => {
  // form the log data
  let logdata = {
    'check' : originalCheckData,
    'outcome' : checkOutcome,
    'state' : state,
    'alsert' : alertWarranted,
    'time' : timeOfCheck
  }

  // convert data to string
  let logString = JSON.stringify(logdata)

  // Determine the name of the log file
  let logFileName = originalCheckData.id

  // append the log string to the file
  _logs.append(logFileName, logString, err => {
    if(!err){
      debug('Logging to the file succeeded')
    } else {
      debug('Logging to file failed')
    }
  })
}

// Timer to execute the worker-process once per minute
workers.loop = () => {
  setInterval(() => {
    workers.gatherAllChecks()
  }, 1000 * 60)
}

// rotate and compress the log files
workers.rotateLogs = () => {
  // list all the non-compressed log files
  _logs.list(false, (err, logs) => {
    if(!err && logs && logs.length){
      logs.forEach( (logName)=>{
        // Compress the data to a different file
        let logId = logName.replace('.log','')
        let newFileId = logId+'-'+Date.now()
        _logs.compress(logId, newFileId, (err) => {
          if(!err){
            // Truncate the log
            _logs.truncate(logId, (err) => {
              if(!err){
                debug('Success truncating log file')
              } else {
                debug('Error truncating log file')
              }
            })
          } else {
            debug('Error compressing one of the log files', err)
          }
        })
      })
    } else {
      debug('Error could not find any logs to rotate')
    }
  })
}



// Timer to execute the log-rotation process once per day
workers.logRotationLoop = () => {
  setInterval( () => {
    workers.rotateLogs()
  },1000 * 60 * 60 * 24)
}

// Init script
workers.init = () => {

  // send to console in yellow
  console.log('\x1b[33m%s\x1b[0m', 'Background workers are running')

  // Execute all the checks immediately
  workers.gatherAllChecks()
  // Call the loop so that checks will execute later on
  workers.loop()
  // Compress all logs immediately
  workers.rotateLogs()
  // call the compression loop so logs will be compressed later on
  workers.logRotationLoop()
 }


// Export the module
module.exports = workers