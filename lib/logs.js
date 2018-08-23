/*
 * Library for storing and rotating logs
 * 
 */ 

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')


// container for the module
let lib = {}

// Base directory for the logs folder
lib.baseDir = path.join(__dirname, '/../.logs/')


// Append a string to a file. Create the file if it doesn't exist
lib.append = (file, str, callback) => {
  // open the file
  fs.open(lib.baseDir+file+'.log', 'a', (err, fileDescripter) => {
    if(!err && fileDescripter){
      fs.appendFile(fileDescripter, str+'\n', (err) =>{
        if(!err){
          fs.close(fileDescripter, (err) => {
            if(!err) {
              callback(false)
            } else {
              callback('Error closing the file while being appended')
            }
          })
        } else {
          callback('Error appending the file')
        }
      })
    } else {
      callback('Could not open the file for appending')
    }
  })
}


// list all the logs and optionaly include the compressed logs
lib.list = (includeCompressedLogs, callback) => {
  fs.readdir(lib.baseDir, (err, data) => {
    if(!err && data && data.length > 0) {
      let trimmedFileNames = []
      data.forEach( fileName => {
        // add .log files
        if(fileName.indexOf('.log') > -1){
          trimmedFileNames.push(fileName.replace('.log', ''))
        }
        // add on the .gz files
        if(fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs){
          trimmedFileNames.push(fileName.replace('.gz.b64', ''))
        }
      })
      callback(false, trimmedFileNames)
    } else {
      callback(err, data)
    }
  })
}

// compress the contents of a log file into a gz.b64 file within the same directory
lib.compress = (logId, newFileId, callback) => {
  let sourceFile = logId+'.log'
  let destFile = newFileId+'.gz.b64'

  fs.readFile(lib.baseDir+sourceFile,'utf8', (err, inputString) => {
    if(!err && inputString){
      // compress with gzip
      zlib.gzip(inputString, (err, buffer) => {
        if(!err && buffer){
          // send the data to destination file
          fs.open(lib.baseDir+destFile, 'wx', (err, fileDescripter) => {
            if(!err && fileDescripter){
              // write to the destination file
              fs.writeFile(fileDescripter, buffer.toString('base64'), err => {
                if(!err){
                  // close the destination file
                  fs.close(fileDescripter, err => {
                    if(!err){
                      callback(false)
                    } else {
                      callback(err)
                    }
                  })
                } else {
                  callback(err)
                }
              })
            } else {
              callback(err)
            }
          })
        } else {
          callback(err)
        }
      })
    } else {
      callback(err)
    }
  })  
}

// decompress the contents of a .gz.b64 file into a string variable
lib.decompress = (fileId, callback) => {
  let fileName = fileId+'.gz.b64'
  fs.readFile(lib.baseDir+fileName, 'utf8', (err, str) => {
    if(!err && str){
      // decompress the data
      let inputBuffer = Buffer.from(str, 'base64')
      zlib.unzip(inputBuffer, (err, outputBuffer) => {
        if(!err && outputBuffer){
          // callback results
          let str = outputBuffer.toString()
          callback(false, str)
        } else {
          callback(err)
        }
      })
    } else {
      callback(err)
    }
  })
}


// truncate a log file
lib.truncate = (logId, callback) => {
  fs.truncate(lib.baseDir+logId+'.log',0, (err) => {
    if (!err){
      callback(false)
    } else {
      callback(err)
    }
  })
}






// export the module
module.exports = lib