/*
 * Primary file for the API
 *
 */

 // Dependencies
const http = require('http')
const url = require('url')

// server should respond to requests with a string
const server = http.createServer((req, res) => {

  // get url and parse it
  let parseUrl = url.parse(req.url, true)

  // get the path from the url
  let path = parseUrl.pathname
  let trimmedPath = path.replace(/^\/+|\/+$/g, '')

  // send the response
  res.end('Hello World\n')

  // log the request
  console.log('Request received on path: '+trimmedPath)


})
// start the server and have it listen on port 3000
server.listen(3000, () => console.log('The server is listening on port 3000 now'))


