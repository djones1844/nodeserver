/*
 * Create and export config variables
 */

 // container for all env
 let environments = {}

 // staging object
 environments.staging = {
     'httpPort' : 3000,
     'httpsPort' : 30001,
     'envName' : 'staging',
     'hashingSecret' : 'alittlesecret',
     'maxChecks' : 5,
     'twilio' : {
      'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
      'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
      'fromPhone' : '+15005550006'
    }
 }

 // production object
 environments.production = {
     'httpPort' : 5000,
     'httpsPort' : 5001,
     'envName': 'production',
     'hashingSecret' : 'alotofsecret',
     'maxChecks' : 5
 }

// choose environment
let currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase(): ''

// check env validity and default to staging
let environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging

// export env
module.exports = environmentToExport