/*
 * Primary file for API
 */

 // Dependencies

const server = require('./lib/server')
const workers = require('./lib/workers')

// declare app object
var app = {}

// Init function
app.init = () => {
  // Start the server
  server.init()

  // Start the workers
  workers.init()
}

// execute app
app.init()


module.exports = app
