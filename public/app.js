/*
 *Frontend Logic for the Application
 * 
 */ 

 // Container for the front end app
 let app = {}


 // Config
 app.config = {
   'sessionToken' : false
 }
 
 // AJAX for the restful API
app.client = {}


// Inerface for making API calls
app.client.request = (headers, path, method, queryStringObject, payload, callback) => {
  // set defaults
  headers = typeof(headers) == 'object'  && headers != null ? headers : {}
  path = typeof(path) == 'string' ? path : '/'
  method = typeof(path) == 'string' && ['POST',  'GET', 'PUT', 'DELETE'].indexOf(method) > -1 ? method.toUpperCase() : 'GET'
  queryStringObject = typeof(headers) == 'object'  && headers != null ? headers : {}
  payload = typeof(headers) == 'object'  && headers != null ? headers : {}
  callback = typeof(callback) == 'function' ? callback : false

  // for each query string parameter sent, add it to the path
  let requestUrl = path+'?'
  let counter = 0
  for (let queryKey in queryStringObject){
    if(queryStringObject.hasOwnProperty(queryKey)){
      counter++
      // if at least one query string paraeter has allready been added, prepend new ones with an '&'
      if(counter > 1){
        requestUrl+='&'
      }
      // add the key value
      requestUrl+=queryKey+'='+queryStringObject[queryKey]
    }
  }
  // Form the http request as a JSON type
  let xhr = new XMLHttpRequest()
  xhr.open(method, requestUrl, true)
  xhr.setRequestHeader("Content-Type", "application/json")

  // For each header sent, add it to the request one at a time
  for(let headerKey in headers) {
    if(headers.hasOwnProperty(headerKey)){
      xhr.setRequestHeader(headerKey, headers[headerKey])
    }
  } 

  // If there is a current sesion token add that as well to header
  if(app.config.sessionToken) {
    xhr.setRequestHeader("token", app.config.sessionToken.id)
  }

  // When the request comes back, handle the response
  xhr.onreadystatechange = () => {
    if(xhr.readyState == XMLHttpRequest.DONE) {
      let statusCode = xhr.status
      let responseReturned = xhr.responseText

      // Callback if requested
      if(callback) {
        try{
          let parseResponse = JSON.parse(responseReturned)
          callback(statusCode, parseResponse)
        } catch(e){
          callback(statusCode, false)
        }
      }
    }
  }

  // Send the payload as JSON
  let payloadString = JSON.stringify(payload)
  xhr.send(payloadString)
}




