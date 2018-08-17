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
  let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.lastname.trim() : false
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