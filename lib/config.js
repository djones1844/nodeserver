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
     'maxChecks' : 5
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