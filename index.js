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
    // send the response
    res.end('Hello World\n')
    // log the request path
    console.log('Request received with these headers: ', buffer)
  })

})

// start the server and have it listen on port 3000
server.listen(3000, () => console.log('The server is listening on port 3000 now'))


