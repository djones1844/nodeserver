 /*
  * Library for data CRUD
  * 
  */

const fs = require('fs')
const path = require('path')
const helpers = require('./helpers')

var lib = {}

// base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/')

// Create
lib.create = function(dir, filename, data, callback){
    // ope file for writing
    fs.open(lib.baseDir+dir+'/'+filename+'.json','wx', (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
         // Convert data to string
         let stringData = JSON.stringify(data)
         // write to and close the file
         fs.writeFile(fileDescriptor, stringData,callback, err => {
             if(!err){
                // close file
                fs.close(fileDescriptor, err => {
                    if (!err){
                        callback(false)
                    } else {
                        callback('Error closing new file')
                    }
                })
             } else {
                 callback('Error writing to new file')
             }
         })
      } else {
          callback('Could not create new file, it may already exist')
      } 
    })
}


// Read 
lib.read = function(dir, file, callback){
  fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf8', (err, data) => { 
    if(!err && data){
      let parsedData = helpers.parseJsonToObject(data)
      callback(false, parsedData)
    } else {
      callback(err, data)   
    }
  })
} 

// Update
lib.update = function (dir, file, data, callback) {
  // Open the file for writing
  fs.open(lib.baseDir+dir+'/'+file+'.json','r+', (err, fileDescriptor) => {  
    if(!err && fileDescriptor) {
      // Convert data to string
      let stringData = JSON.stringify(data)
      // truncate the file
      fs.truncate(fileDescriptor, (err) => {
        if(!err){
            // write to file
            fs.writeFile(fileDescriptor, stringData, (err) => {
                if(!err){
                  fs.close(fileDescriptor, (err) => {
                      if(!err) {
                          callback (false)
                      } else {
                          callback('Error closing the file')
                      }
                  })
                } else {
                    callback('Error writing to existing file')
                }
            })
          
        } else {
            callback('Error truncating file')
        }
    
      })
    } else {
      callback('Could not open the file for updating, it may not exist yet')
    }
  })
}


// Delete
lib.delete = function(dir, file, callback){
    // Unlink the file
    fs.unlink(lib.baseDir+dir+'/'+file+'.json', (err) =>{
      if(!err) {
          callback(false)
      } else {
          callback('Error deleting the file')
      }
    })

}

// export the lib
module.exports = lib
