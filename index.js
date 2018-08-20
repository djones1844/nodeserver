/*
 * Primary file for API
 */

// Dependencies
const http = require('http')
const https = require('https')
const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder
const config = require('./lib/config')
const fs = require('fs')
const handlers = require('./lib/handlers')
const helpers = require('./lib/helpers')

 // Instantiate the HTTP server
 let httpServer = http.createServer((req, res) => {
  unifiedServer(req,res)
})

// Instantiate the HTTPS server
let httpsServerOptions = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem')
}

let httpsServer = https.createServer(httpsServerOptions, (req,res) => {
  unifiedServer(req,res)
})

// Start the HTTP server
httpServer.listen(config.httpPort, () => {
  console.log('The HTTP server is running on port '+config.httpPort)
})

// Start the HTTPS server
httpsServer.listen(config.httpsPort,function(){
 console.log('The HTTPS server is running on port '+config.httpsPort)
})

// All the server logic for both the http and https server
let unifiedServer = (req, res) => {

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
      let chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound
      
      // Construct the data object to send to the handler
      let data = {
        'trimmedPath' : trimmedPath,
        'queryStringObject' : queryStringObject,
        'method' : method,
        'headers' : headers,
        'payload' : helpers.parseJsonToObject(buffer)    
      }

      // Route the request to the handler specified in the router
      chosenHandler(data, (statusCode, payload) => {

        // Use the status code returned from the handler, or set the default status code to 200
        statusCode = typeof(statusCode) == 'number' ? statusCode : 200

        // Use the payload returned from the handler, or set the default payload to an empty object
        payload = typeof(payload) == 'object'? payload : {}

        // Convert the payload to a string
        var payloadString = JSON.stringify(payload)

        // Return the response
        res.setHeader('Content-Type', 'application/json')
        res.writeHead(statusCode)
        res.end(payloadString)

      })
      // log the request path
      //console.log('Returning this response: ', statusCode, payloadString)
  })
}

// Define the request router
let router = {
  'ping' : handlers.ping,
  'users' : handlers.users,
  'tokens' : handlers.tokens
}
