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
lib.create = (dir, filename, data, callback) => {
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
lib.read = (dir, file, callback) => {
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
lib.update =  (dir, file, data, callback) => {
  // Open the file for writing
  fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', (err, fileDescriptor) => {
    if(!err && fileDescriptor){
      // Convert data to string
      let stringData = JSON.stringify(data)

      // Truncate the file
      fs.truncate(fileDescriptor, err => {
        if(!err){
          // Write to file and close it
          fs.writeFile(fileDescriptor, stringData, err => {
            if(!err){
              fs.close(fileDescriptor, err => {
                if(!err){
                  callback(false)
                } else {
                  callback('Error closing existing file')
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
      callback('Could not open file for updating, it may not exist yet')
    }
  })
}

// Delete
lib.delete = (dir, file, callback) => {
    // Unlink the file
    fs.unlink(lib.baseDir+dir+'/'+file+'.json', err =>{
      if(!err) {
          callback(false)
      } else {
          callback('Error deleting the file')
      }
    })

}

// List files in directory
lib.list = (dir, callback) => {
  fs.readdir(lib.baseDir+dir+'/', (err, data) => {
    if(!err && data && data.length > 0){
      let trimmedFileNames = []
      data.forEach( filename => {
        trimmedFileNames.push(filename.replace('.json', ''))
      })
      callback(false, trimmedFileNames)
    } else {
      callback(err, data)
    }
  })
} 


// export the lib
module.exports = lib
