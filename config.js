/*
 * Create and export config variables
 */

 // container for all env
 let environments = {}

 // staging object
 environments.staging = {
     'port' : 3000,
     'envName' : 'staging'
 }

 // production object
 environments.production = {
     'port' : 5000,
     'envName': 'production'
 }

 // choose environment
 let currentEnvironment = typeof(proccess.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase(): ''

// check env validity and default to staging
let environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging

// export env
module.exports = environmentToExport