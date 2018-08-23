/*
* Misc helper functions and tasks
*/

// Dependencies
const crypto = require('crypto')
const config = require('./config')
const https = require('https')
const querystring = require('querystring')
const path = require('path')
const fs = require('fs')

// container object for all the helpser

let helpers = {}

// create a SHA256 hash
helpers.hash = (str) => {
  if(typeof(str) == "string" && str.length > 0){
    let hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex')
    return hash 
  } else {
      return false
  }
}

// Parse a JSON string to an object in all cases w/o throwing errors
helpers.parseJsonToObject = (str) => {
  try {
    let obj = JSON.parse(str)
    return obj
  } catch(e) {   
    return {}    
  }
}

// Create a string of random alphanumeric charachter of a given length
helpers.createRandomString = (strLength) => {
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false
 if(strLength) {
  // Define all possible characters
  const possibleCharacters = '1234567890abcdefghijklmnopqrstuvwqxyz'
  let str = ''
  let randomCharacter = ''

  for(let i=0;i<strLength;i++){
    // get a random char from possible Char and add it to str
    randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length))
    str += randomCharacter
  }
  return str

 } else {
   return false
 }
}

// send an SMS via Twilio
helpers.sendTwilioSms = (phone, msg, callback) => {
  // Validate parameters
  phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false
  msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false
  if(phone && msg){
    // configure the request payload
    let payload = {
      'From' : config.twilio.fromPhone,
      'To' : '+1'+phone,
      'Body': msg
    }
    // stringify the payload
    let stringPayload = querystring.stringify(payload)
    let requestDetails = {
      'protocol' : 'https:',
      'hostname' : 'api.twilio.com',
      'method' : 'POST',
      'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
      'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
      'headers' : {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length' : Buffer.byteLength(stringPayload)
      }
    }
    // Instantiate the request object
    let req = https.request(requestDetails, (res) => {
      // grab status of request
      let status = res.statusCode
      // callback successfully if the request went through
      if(status == 200 || status == 201){      
        callback(false)
      } else {
        callback('Status code returnd was', status)
      }
    })
    // Bind to the error event so it doesn't get thrown
    req.on('error', (e) => {
      callback(e)
    })
    // add the payload
    req.write(stringPayload)
    // end request
    req.end()
  } else {
    callback('Given parameters were missing of invalid')
  }
}

// Get the string content of a template
helpers.getTemplate = (templateName, callback) => {
  templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false
  if(templateName){
    let templateDir = path.join(__dirname,'/../templates/')
    fs.readFile(templateDir+templateName+'.html', 'utf8', (err, str) => {     
      if(!err && str){
        callback(false, str)
      } else {
        callback('No template could be found')
      }
    })
  } else {
    callback('A valid template name was not specified')
  }
}








module.exports = helpers
