/*
* Misc helper functions and tasks
*/

// Dependencies
const crypto = require('crypto')
const config = require('./config')


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

// Create a string of random alphanumeric charachter of a given lenght
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


module.exports = helpers
