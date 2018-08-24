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
helpers.getTemplate = (templateName, data, callback) => {
  templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false
  data = typeof(data) == 'object' && data !== null ? data : {}
  if(templateName){
    let templateDir = path.join(__dirname,'/../templates/')
    fs.readFile(templateDir+templateName+'.html', 'utf8', (err, str) => {     
      if(!err && str && str.length > 0){
        // do interpolation
        let finalString = helpers.interpolate(str, data)
        callback(false, finalString)
      } else {
        callback('No template could be found')
      }
    })
  } else {
    callback('A valid template name was not specified')
  }
}

// add the universal header and footer and pass 
helpers.addUniversalTemplates = (str, data, callback) => {
  str = typeof(str) == 'string' && str.length > 0 ? str : ''
  data = typeof(data) == 'object' && data !== null ? data : {}
  // get the header
  helpers.getTemplate('_header', data, (err, headerString) => {
    if(!err && headerString){
      // get the footer
      helpers.getTemplate('_footer', data, (err, footerString) => {
        if(!err && footerString){
          // concat the three strings
          let fullString = headerString+str+footerString
          callback(false, fullString)
        } else {
          callback('Could not find the footer template')
        }
      })
    } else {
      callback('Could not find the header template')
    }
  })

}


// take a given string and data object and replace all the keys in it
helpers.interpolate = (str, data) => {
  str = typeof(str) == 'string' && str.length > 0 ? str : ''
  data = typeof(data) == 'object' && data !== null ? data : {}
  // Add the templateGlobal to the data object, prepending their name with the name "global"
  for(let keyName in config.templateGlobals) {
    if(config.templateGlobals.hasOwnProperty(keyName)){
      data['global.'+keyName] = config.templateGlobals[keyName]
    }
  }
  // for each key in the data object, insert it's value int the string at the corresponding placeholder
  for(let key in data){
    if(data.hasOwnProperty(key) && typeof(data[key]) == 'string') {
      let replacement = data[key]
      let find = '{'+key+'}'
      str = str.replace(find, replacement)
    }
  }
  return str
}

// get the contents of a public asset
helpers.getStaticAssets = (fileName, callback) => {
  fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false
  if(fileName){
    let publicDir = path.join(__dirname, '/../public/')
    fs.readFile(publicDir+fileName, (err, data) => {
      if(!err && data){
        callback(false, data)
      } else {
        callback('No file was found')
      }
    })
  } else {
    callback('A valid filename was not specified')
  }
}





module.exports = helpers
