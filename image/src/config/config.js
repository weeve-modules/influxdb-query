const env = require('../utils/env')

module.exports = {
  INGRESS_HOST: env('INGRESS_HOST', '127.0.0.1'),
  INGRESS_PORT: env('INGRESS_PORT', '8081'),
  MODULE_NAME: env('MODULE_NAME', 'influxdb-http'),
  EGRESS_URL: env('EGRESS_URL', ''),
  INFLUXDB_URL: env('INFLUXDB_URL', ''),
  INFLUXDB_API_KEY: env('INFLUXDB_API_KEY', ''),
  INFLUXDB_ORG: env('INFLUXDB_ORG', 'weeve'),
  INFLUXDB_BUCKET: env('INFLUXDB_BUCKET', 'testmp'),
  RUN_AS_STANDALONE: env('RUN_AS_STANDALONE', 'no'),
}
