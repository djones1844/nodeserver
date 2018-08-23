/*
 * Server-related tasks
 * 
 */


// Dependencies
const http = require('http')
const https = require('https')
const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder
const config = require('./config')
const fs = require('fs')
const handlers = require('./handlers')
const helpers = require('./helpers')
const path = require('path')
const util = require('util')
const debug = util.debuglog('server')

// instantiate the server module object
let server = {}

 
 // Instantiate the HTTP server
 server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req,res)
})

// Instantiate the HTTPS server
server.httpsServerOptions = {
  'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
}

server.httpsServer = https.createServer(server.httpsServerOptions, (req,res) => {
  server.unifiedServer(req,res)
})

// All the server logic for both the http and https server
server.unifiedServer = (req, res) => {

  // Parse the url
  let parsedUrl = url.parse(req.url, true)

  // Get the path
  let path = parsedUrl.pathname
  let trimmedPath = path.replace(/^\/+|\/+$/g, '')

  // Get the query string as an object
  let queryStringObject = parsedUrl.query

  // Get the HTTP method
  let method = req.method.toLowerCase()

  //Get the headers as an object
  let headers = req.headers

  // Get the payload,if any
  let decoder = new StringDecoder('utf-8')
  let buffer = ''
  
  req.on('data', (data) => {
      buffer += decoder.write(data)
  })

  req.on('end', () => {
    buffer += decoder.end()

    // Check the router for a matching path for a handler. If one is not found, use the notFound handler instead.
    let chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound
    
    // Construct the data object to send to the handler
    let data = {
      'trimmedPath' : trimmedPath,
      'queryStringObject' : queryStringObject,
      'method' : method,
      'headers' : headers,
      'payload' : helpers.parseJsonToObject(buffer)    
    }

      // Route the request to the handler specified in the router
      chosenHandler(data, (statusCode, payload, contentType) => {

        // Use the status code returned from the handler, or set the default status code to 200
        statusCode = typeof(statusCode) == 'number' ? statusCode : 200

        // Use the payload returned from the handler, or set the default payload to an empty object
        

        // determine the type of response falling back on json
        contentType = typeof(contentType) == 'string' ? contentType : 'json'

        // Return the response that are content-specific
        let payloadString = ''
        if(contentType == 'json'){
          res.setHeader('Content-Type', 'application/json')
          payload = typeof(payload) == 'object'? payload : {}
          payloadString = JSON.stringify(payload)
        }


        if(contentType == 'html'){
          res.setHeader('Content-Type', 'text/html')
          payloadString = 'string' ? payload : ''

        }

        // return the response-parts that are common to all content-types
        res.writeHead(statusCode)
        res.end(payloadString)

        // log the request path if the response is 200 print green, else print red
        if(statusCode == 200){
          debug('\x1b[32m%s\x1b[0m', method.toUpperCase()+' /'+trimmedPath+' '+statusCode) 
        } else {
          debug('\x1b[31m%s\x1b[0m', method.toUpperCase()+' /'+trimmedPath+' '+statusCode) 
        }
      })
  })
}

// Define the request router
server.router = {
  '' : handlers.index,
  'account/create' : handlers.accountCreate,
  'account/edit' : handlers.accountEdit,
  'account/deleted' : handlers.accountDeleted,
  'session/create' : handlers.sessionCreate,
  'session/deleted' : handlers.sessionDeleted,
  'checks/all' : handlers.checksList,
  'checks/create' : handlers.checkCreate,
  'checks/edit' : handlers.checkEdit,
  'ping' : handlers.ping,
  'api/users' : handlers.users,
  'api/tokens' : handlers.tokens,
  'api/checks' : handlers.checks
}

// execute
server.init = () => {
 // Start the HTTP server
  server.httpServer.listen(config.httpPort, () => {
    console.log('\x1b[32m%s\x1b[0m', 'The HTTP server is running on port '+config.httpPort)
  })

  // Start the HTTPS server
  server.httpsServer.listen(config.httpsPort,function(){
    console.log('\x1b[32m%s\x1b[0m', 'The HTTPS server is running on port '+config.httpsPort)
  })

}

// export the server as a module
module.exports =  server
 