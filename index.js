/*
 * Primary file for the API
 *
 */

 // Dependencies
const http = require('http')
const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder

// server should respond to requests with a string
const server = http.createServer((req, res) => {

  // get url and parse it
  let parseUrl = url.parse(req.url, true)

  // get the path 
  let path = parseUrl.pathname
  let trimmedPath = path.replace(/^\/+|\/+$/g, '')

  // Get the query string as an object
  let queryStringObject = parseUrl.query

  // get the HTTP Method
  let method = req.method.toLowerCase()

  // get the headers as an object
  let headers = req.headers 
 
  // Get Payload, if any
  let decoder = new StringDecoder('utf-8')
  let buffer = ''
  req.on('data', (data) => buffer += decoder.write(data))
  req.on('end', () => {
    buffer += decoder.end()
    
    // chose the correct router handler, if one not found use the notFound handler
    let chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound

    // construct the data object to send to the handler
    let data = {
      'trimmedPath' : trimmedPath,
      'queryStringObject' : queryStringObject,
      'method' : method,
      'headers' : headers,
      'payload' : buffer
    }

    // routh the request specivied in the router
    chosenHandler(data, (statusCode, payload) => {
      // Use the status code called back by the handler, or default to 200
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200
     
      // used the payload calld by the handler or default to 
      payload = typeof(payload) == 'object' ? payload : {}

      // Covert payload to string
      let payloadstring = JSON.stringify(payload)

      // return the response
      res.writeHead(statusCode)
      res.end(payloadstring)
       // log the request path
       console.log('Returning this response: ', statusCode, payloadstring)

    })    

  })

})

// start the server and have it listen on port 3000
server.listen(3000, () => console.log('The server is listening on port 3000 now'))

// define the router's handlers
let handlers =  {}

// sample hanler
handlers.sample = (data, callback) => {
  // Callback a http status code, and a payload object
  callback(406, {'name' : 'sample handler'})

}

// not found handler
handlers.notFound = (data, callback) => {
  callback(404)
} 

// defining a request router
let router = {
  'sample' : handlers.sample
}