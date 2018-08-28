/*
* Request Handlers
*/

// Dependencies
const _data = require('./data')
const helpers = require('./helpers')
const config = require('./config')
 
// Define all the handlers
var handlers = {}

// Users
handlers.users = (data, callback) => {
  let acceptableMethods = ['post', 'get', 'put', 'delete']
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._users[data.method](data, callback)
  } else {
    callback(405)
  }
}

// container for users submethods
handlers._users = {}

/*
 * HTML-GUI Handlers
 * 
 */

// Index API Handler

handlers.index = (data, callback)=> {
  // reject any non-GET request
  if(data.method == 'get'){
    // prepare data for intropolation
    let templateData = {
      'head.title' : 'Uptime Monitoring - Made Simple',
      'head.description' : 'Free and simple uptime monitoring for HTTP/HTTPS servers. Text notification when site is down.',
      'body.class' : 'index'
    }


    // Read in the index template as a string
    helpers.getTemplate('index', templateData, (err, str) => {
      if(!err && str){
        // add universal header and footer
        helpers.addUniversalTemplates(str, templateData, (err, str) => {
          if(!err && str){
            callback(200, str, 'html')
          } else {
              callback(500, undefined, 'html')
          }
        })
      } else {
        callback(500, undefined, 'html')
      }
    })
  } else {
    callback(405, undefined, 'html')
  }
}

// Create Account
handlers.accountCreate = (data, callback) => {
  // Reject any request that isn't a GET
  if(data.method == 'get') {
    // Prepare data for interpolation
    var templateData = {
      'head.title' : 'Create an Account',
      'head.description' : 'Signup is easy and only takes a few seconds.',
      'body.class' : 'accountCreate'
    }
    // Read in a template as a string
    helpers.getTemplate('accountCreate', templateData, (err, str) => {
      if(!err && str){
        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, (err, str) => {
          if(!err && str){
            // Return that page as HTML
            callback(200, str, 'html')
          } else {
            callback(500, undefined, 'html')
          }
        })
      } else {
        callback(500, undefined, 'html')
      }
    })
  } else {
    callback(405, undefined, 'html')
  }
}

// favicon 
handlers.favicon = (data, callback) => {
  // reject any non-GET request
  if(data.method == 'get'){
    // read in the favicon's data
    helpers.getStaticAssets('favicon.ico', (err, data) => {
      if(!err && data){
        callback(200, data, 'favicon')
      } else {
        callback(500)
      }
    })
  } else {
    callback(405)
  }
}

// Public assets
handlers.public = (data, callback) => {
  // reject any non-GET request
  if(data.method == 'get'){
    // get the filename
    let trimmedAssetName = data.trimmedPath.replace('public/','').trim()
    if(trimmedAssetName.length > 0){
      helpers.getStaticAssets(trimmedAssetName, (err, data) => {
        if(!err && data){
          // Determine the content type and default to text
          let contentType = 'plain'
          if(trimmedAssetName.indexOf('.css') > -1){
            contentType = 'css'
          }
          if(trimmedAssetName.indexOf('.png') > -1){
            contentType = 'png'
          }          
          if(trimmedAssetName.indexOf('.ico') > -1){
            contentType = 'ico'
          }
          callback(200, data, contentType)
        } else {
          callback(404)
        }
      })
    } else {
      callback(404)
    }
  } else {
    callback(405)
  }
}

/*
 * JSON-API Handlers
 * 
 */


 // Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = (data, callback) => {
  // Check that all required fields are filled out
  let firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
  let lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
  let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false
  let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false
  let tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false

  if(firstName && lastName && phone && password && tosAgreement){
    // Make sure the user doesnt already exist
    _data.read('users',phone, (err, data) => {
      if(err){
        // Hash the password
        let hashedPassword = helpers.hash(password)

        // Create the user object
        if(hashedPassword){
          let userObject = {
            'firstName' : firstName,
            'lastName' : lastName,
            'phone' : phone,
            'hashedPassword' : hashedPassword,
            'tosAgreement' : true
          }

          // Store the user
          _data.create('users', phone, userObject, (err) => {
            if(!err){
              callback(200)
            } else {
              callback(500,{'Error' : 'Could not create the new user'})
            }
          })
        } else {
          callback(500,{'Error' : 'Could not hash the user\'s password.'})
        }
      } else {
        // User alread exists
        callback(400,{'Error' : 'A user with that phone number already exists'})
      }
    })
  } else {
    callback(400,{'Error' : 'Missing required fields'})
  }
}


// Users - get
// Required Data: phone
// Optional Data: none
handlers._users.get = (data, callback) => {
  // check the phonenumber is valid
  let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false
  if(phone){
    // get token from the header
    let token = typeof(data.headers.token) == 'string' ? data.headers.token : false
    // Verify the token is valid for the user's phonenumber
    handlers._tokens.verifyToken(token,phone, (tokenIsValid) => {
      if(tokenIsValid){
        // lookup the user
        _data.read('users', phone, (err, data) => {
          if(!err && data){
            // Remove hashed password since they have no need of it
            delete data.hashedPassword
            callback(200, data)
          } else {
              callback(404)
          }
        })        
      } else {
        callback(403, {'Error' : 'Missing required token in header, or invalid token'})
      }
    })
  } else {
    callback(400, {'err': 'missing required field'})
  }
}
 
// Users - put
// Required data: phone
// Optional data: firstname, lastname, password (at least one required)
handlers._users.put = (data, callback) => {
  // check for required field
  let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false

  // check for the optional fields
  let firstname = typeof(data.payload.firstname) == 'string' && data.payload.firstname.trim().length > 0 ? data.payload.firstname.trim() : false
  let lastname = typeof(data.payload.lastname) == 'string' && data.payload.lastname.trim().length > 0 ? data.payload.lastname.trim() : false
  let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false
  let tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false 

  // error if phone is invalid
  if (phone){
    // Error if nothing sent to update
    if (firstname || lastname || password) { 

      // get token from the header
      let token = typeof(data.headers.token) == 'string' ? data.headers.token : false
      // Verify the token is valid for the user's phonenumber
      handlers._tokens.verifyToken(token,phone, (tokenIsValid) => {
        if(tokenIsValid){
          // Lookup the user
          _data.read('users', phone, (err, userData)=>{
            if(!err && userData){
              if(firstname){
                userData.firstname = firstname
              }
              if(lastname){
                userData.lastname = lastname
              }
              if(password) {
                userData.hashedPassword = helpers.hash(password)
              }     
              // Store the updated user
              _data.update('users', phone, userData, (err) => {
                if(!err){
                  callback(200)
                } else {
                  console.log(err)
                  callback(500, {'Error' : 'Could not update the user'})
                }
              })
            } else {
              callback(400, {'Error' : 'The specified user does not exist'})
            }
          } )
        } else {
          callback(403, {'Error' : 'Missing required token in header, or invalid token'})
        }
      })  
    } else {
      callback(400, {'Error': 'Missing fields to update'})
    }
  } else {
    callback(400, {'Error' : 'Missing required field'})
  }
}

// Users - delete
handlers._users.delete = (data, callback) => {
  // check the phone number is valid 
  let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false
  if(phone){
    // get token from the header
    let token = typeof(data.headers.token) == 'string' ? data.headers.token : false
    // Verify the token is valid for the user's phonenumber
    handlers._tokens.verifyToken(token,phone, (tokenIsValid) => {
      if(tokenIsValid){
        // lookup the user
        _data.read('users', phone, (err, userData) => {
          if(!err && userData){
            _data.delete('users', phone, (err) => {
              if(!err){
                // callback(200)
                // Delete user's check files
                let userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : []
                let checksToDelete = userChecks.length
                if(checksToDelete > 0){
                  let checksDeleted = 0
                  let deletionErrors = false
                  // loop through the checks
                  userChecks.forEach((checkId) => {
                    // delete the check
                    _data.delete('checks', checkId, (err) => {
                      if(err){
                        deletionErrors = true
                      }
                      checksDeleted++
                      if(checksDeleted == checksToDelete){
                        if(!deletionErrors){
                          callback(200)
                        } else {
                          callback(500,{'Error': 'Errors encounterd while trying to remove user checks'})
                        }
                      }
                    })
                  })
                } else {
                  callback(200)
                }
              } else {
                callback(500,{'Error': 'Could not delete the specified user'})
              }
            })
          } else {
            callback(400, {'Error': 'Could not find the spedified user'})
          }
        })
      } else {
        callback(403, {'Error' : 'Missing required token in header, or invalid token'})
      }
    })
  } else {
    callback(400, {'err': 'missing required field'})
  }
}

// Tokens
handlers.tokens = (data, callback) => {
  let acceptableMethods = ['post', 'get', 'put', 'delete']
  if(acceptableMethods.indexOf(data.method) > -1){
      handlers._tokens[data.method](data, callback)
  } else {
      callback(405)
  }
}

// Token Container Object for all token methods
handlers._tokens = {}

// Token - post
// Required data: phone, password  
// Optional data: none 
// returns new token
handlers._tokens.post = (data, callback) => {
  let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false    
  let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false
  if(phone && password){  
    // lookup the user that matches the phone number
    _data.read('users', phone, (err, userData) => {
      if(!err && userData){
        // compare password provided to actual password
        let hashedPassword = helpers.hash(password)      
        if(hashedPassword == userData.hashedPassword){
          // create a new token with random name and experation in one hour
          let tokenId = helpers.createRandomString(20)
          let expires = Date.now() + 1000 * 60 * 60          
          let tokenObject = {
            'phone': phone,
            'id': tokenId,
            'expires' : expires
          }

          // store the token
          _data.create('tokens', tokenId, tokenObject, (err) => {
            if(!err){
              callback(200, tokenObject)
            } else {
              callback(500, {'Error': 'Could not create a new token'})
            }
          })

        } else {
          callback(400, {'Error': 'Incorrect password or username'})
        }
      } else {
        callback(400, {'Error': 'Could not find the user data'})
      }
    })
  } else {
    callback(400, {'Error': 'Missing required fields'})
  }
}  

// Token - get
// Required data : id
// Optional data : none
// returns existing token
handlers._tokens.get = (data, callback) => {
  // check the id is valid
  let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false
  if(id){
    // lookup the token
    _data.read('tokens', id, (err, tokenData) => {
      if(!err && tokenData){
        callback(200, tokenData)
      } else {
        callback(404)
      }
    })
  } else {
    callback(400, {'err': 'missing required field'})
  }
}

// Token - put
// Required data: id, extend
// Optional data: none
// returns existing token with timout extended
handlers._tokens.put = (data, callback) => {
  let id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false
  let extend = (typeof(data.payload.extend) == 'boolean' && data.payload.extend == true)   
  if(id && extend){
    //Lookup the token
    _data.read('tokens', id, (err, tokenData) =>{
      if(!err && tokenData){
        // check to make sure tokan has not already expired
        if(tokenData.expires > Date.now()){
          // the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60
          // update the token
          _data.update('tokens', id, tokenData, (err) => {
            if(!err){
              callback(200)
            } else {
              callback(500, {'Error' : 'Could not update the tokens experation'})
            }
          } )
        } else {
          callback(400, {'Error' : 'The token has alread expired and cannot be extended'})
        }
      } else {
        callback(400, {'Error' : 'Specified token does not exist'})
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required fields or fields are invalid'})
  }
}

// Token - delete
// Required data: id
// Optional data: none
// Terminates current session and removes token
handlers._tokens.delete = (data, callback) => {
  // check if id is valid
  let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false 
  if(id){
    // lookup the user
    _data.read('tokens', id, (err, data) => {
      if(!err && data){
        _data.delete('tokens', id, (err) => {
          if(!err){
            callback(200)
          } else {
            callback(500,{'Error': 'Could not delete the specified token'})
          }
        })
      } else {
          callback(400, {'Error': 'Could not find the spedified token'})
      }
    })
  } else {
    callback(400, {'err': 'missing required field'})
  }
}

// Verify user's token is valid for the current user
handlers._tokens.verifyToken = (id, phone, callback) => {
  _data.read('tokens', id, (err, tokenData) => {
    if(!err && tokenData){
      // verify tokein is valid for user and not expired
      if(tokenData.phone == phone && tokenData.expires > Date.now()){
        callback(true)
      } else {
        callback(false)
      }
    } else {
      callback(false)
    }
  })
}

// Checks
handlers.checks = (data, callback) => {
  let acceptableMethods = ['post', 'get', 'put', 'delete']
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._checks[data.method](data, callback)
  } else {
    callback(405)
  }
}

// Container object for the Check methods
handlers._checks = {}

// Checks - post
// Required data: protocol, url, method, successCodes, timeoutSeconds
// Optional Data: none
// 
handlers._checks.post = (data, callback) => {
  // validate inputs
  let protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false    
  let url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false    
  let method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false    
  let successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false    
  let timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5? data.payload.timeoutSeconds : false    
  if(protocol && url && method && successCodes && timeoutSeconds){
    // get token from headers
    let token = typeof(data.headers.token) == 'string' ? data.headers.token : false
    
    // Lookup user based on token data
    _data.read('tokens', token, (err, tokenData) => {
      if(!err && tokenData){
        let userPhone = tokenData.phone

        // lookup user data
        _data.read('users', userPhone, (err, userData) => {
          if(!err && userData){
            let userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : []
            // make sure user doesn't excceed his limt on checks
            if(userChecks.length < config.maxChecks){
              // Create a random id for the check
              let checkID = helpers.createRandomString(20)
              
              // Create the check object including the users phone
              let checkObject = {
                'id': checkID,
                'userPhone': userPhone,
                'protocol' : protocol,
                'url': url,
                'method': method,
                'successCodes': successCodes,
                'timeoutSeconds' : timeoutSeconds
              }

              // Save the objet
              _data.create('checks', checkID, checkObject, (err) => {
                if (!err){
                  // add the check id to the user's object
                  userData.checks = userChecks
                  userData.checks.push(checkID)
                  // save the new user data
                  _data.update('users', userPhone, userData, (err) => {
                    if(!err){
                      // Return the data about the new check to the requester
                      callback (200, checkObject)
                    } else {
                      callback (500, {'Error': 'Could not update the user with new check'})
                    }
                  })
                } else {
                  callback(500, {'Error' : 'Could not create the new check'})
                }
              })
            } else {
              callback(400, {'Error' : 'User already has the maximum number of checks ('+config.maxChecks+')'})
            }
          } else {
            callback (403)
          }
        })
      } else {
        callback (403)
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required inputs, or inputs are invalid' })
  }
}

// Checks - get
// Required data: id
// Optional data: none
handlers._checks.get = (data, callback) => {
  // check the id is valid
  let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false
  if(id){
    // lookup the check
    _data.read('checks', id, (err, checkData) => {
      if(!err && checkData){
        
        // get token from the header
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false

        // Verify the token is valid for the owner of the check
        handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
          if(tokenIsValid){
            // return the check data
            callback(200, checkData)
          } else {
            callback(403)
          }
        })
      } else {
        callback(404)
      }
    }) 
  } else {
    callback(400, {'err': 'missing required field'})
  }
}

// Check - put
// Required data: id
// Optional data: protocol, url, method, sucessCodes, timeoutSeconds (one must be supplied)
handlers._checks.put = (data, callback) => {
  // check for required field
  let id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false
  
  // check optional fields
  let protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false    
  let url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false    
  let method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false    
  let successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false    
  let timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5? data.payload.timeoutSeconds : false    

  // check to make sure one of the fields has been sent
  if (id){
    if(protocol || url || method || successCodes || timeoutSeconds){
      // lookup the check
      _data.read('checks', id, (err, checkData) => {
        if(!err && checkData){
          // get token from headers
          let token = typeof(data.headers.token) == 'string' ? data.headers.token : false
          // Verify the token is valid for the owner of the check
          handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
            if(tokenIsValid){
              // update the check where required
              if(protocol){
                checkData.protocol = protocol
              }
              if(url){
                checkData.url = url
              }
              if(method){
                checkData.method = method
              }
              if(successCodes){
                checkData.successCodes = successCodes
              }
              if (timeoutSeconds){
                checkData.timeoutSeconds = timeoutSeconds
              }
              // store the updates
              _data.update('checks', id, checkData, (err) => {
                if(!err){
                  callback(200)
                } else {
                  callback(500, {'Error': 'Could not update the check'})
                }
              })
            } else {
              callback(403)
            }
          })
        } else {
          callback(400, {'Error': 'Check ID did not exist'})
        } 
      }) 
    } else {
      callback(400, {'Error': 'Missing fileds to update'})
    }
  } else {
    callback(400, {'Error': 'Missing required field'})
  }
}

// Check - delete
// Required data: id
// Optional data: none
handlers._checks.delete = (data, callback) => {
  // check the id is valid  
  let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false
  if(id){

    // Lookup the check
    _data.read('checks', id, (err, checkData) =>{
      if(!err && checkData){
        // get token from the header
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false
        
        // Verify the token is valid for the user's phonenumber
        handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
          if(tokenIsValid){
            // delete the check data
            _data.delete('checks', id, (err) =>{
              if(!err){
                // lookup the user
                _data.read('users', checkData.userPhone, (err, userData) => {
                  if(!err && userData){
                    let userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : []
                    
                    // remove the deleted check from the list of checks
                    let checkPosition = userChecks.indexOf(id)
                    if(checkPosition > -1){
                      userChecks.splice(checkPosition)
                      // Resave the user's data
                      _data.update('users', checkData.userPhone, userData, (err) => {
                        if(!err){
                          callback(200)
                        } else {
                          callback(500,{'Error': 'Could not update the user'})
                        }
                      })
                    } else {
                      callback(500, {'Error': 'Could not find the check on the users object'})
                    }
                  } else {
                    callback(500, {'Error': 'Could not find the user who created the check'})
                  }
                })
              } else {
                callback(500, {'Error': 'Could not delete the check data'})
              }
            })
          } else {
            callback(403)
          }
        })
      } else {
        callback(400, {'Error' : 'The specified check ID does not exist'})
      }
    })
  } else {
    callback(400, {'err': 'missing required field'})
  }
}




// Ping 
handlers.ping = (data,callback) => {
    callback(200)
}

// Not-Found 
handlers.notFound = (data, callback) => {
  callback(404)
}

// export module
module.exports = handlers