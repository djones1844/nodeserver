/*
* Request Handlers
*/

// Dependencies
const _data = require('./data')
const helpers = require('./helpers')
 
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

// Users - post
// required data: firstname,lastname, phone, password, tosAgreement
// optional data: none
handlers._users.post = (data, callback) => {
  // ensure all req data is available
  let firstname = typeof(data.payload.firstname) == 'string' && data.payload.firstname.trim().length > 0 ? data.payload.firstname.trim() : false
  let lastname = typeof(data.payload.lastname) == 'string' && data.payload.lastname.trim().length > 0 ? data.payload.lastname.trim() : false
  let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false    
  let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.lastname.trim() : false
  let tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false 

  if(firstname && lastname && phone && password && tosAgreement){
      // Make sure user doesn't already exist
    _data.read('users', phone, (err, data) => {
      if(err){
         // Hash the password
         let hashedPassword = helpers.hash(password)
         // create the user object
         if(hashedPassword){
            let userObject = {
                'firstname' : firstname,
                'lastname' : lastname,
                'phone' : phone,
                'hashedPassword' : hashedPassword,
                'tosAgreement' : true
            }

            // store the user
            _data.create('users', phone, userObject, (err) => {
                if(!err){
                    callback(200)
                } else {
                    console.log(err)
                    callback(500, {'Error' : 'Could not create the new user'}) 
                }
            })
         } else {
            callback(500, 'Could not hash user   password')
         }
      } else {
          // user already exists
          callback(400, {'Error' : 'A user with that phone number already exists'})
      }
    })
  } else {
      callback(400, {'Error' : 'Missing requried fields'})
  }
  
}

// Users - get
// Required Data: phone
// Optional Data: none
// @TODO only allow authenticated user access their object. 
handlers._users.get = (data, callback) => {
  // check the phonenumber is valid
  let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false
  if(phone){
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
    callback(400, {'err': 'missing required field'})
  }
}

// Users - put
// Required data: phone
// Optional data: firstname, lastname, password (at least one required)
// @TODO limit updates to authorized owners of the object
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
      callback(400, {'Error': 'Missing fileds to update'})
    }
  } else {
    callback(400, {'Error' : 'Missing required field'})
  }
}

// Users - delete
// @TODO Only let the owner of the account delete their profile
// @TODO Cleanup (delete) any files belonging to deleted user, no orphans! 
handlers._users.delete = (data, callback) => {
  // check the phone number is valid 
  // check the phonenumber is valid
  let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false
  if(phone){
    // lookup the user
    _data.read('users', phone, (err, data) => {
      if(!err && data){
        _data.delete('users', phone, (err) => {
          if(!err){
            callback(200)
          } else {
            callback(500,{'Error': 'Could not delete the specified user'})
          }
        })
      } else {
          callback(400, {'Error': 'Could not find the spedified user'})
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