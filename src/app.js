const { EGRESS_URLS, INGRESS_HOST, INGRESS_PORT, MODULE_NAME, RUN_AS_STANDALONE } = require('./config/config.js')
const express = require('express')
const app = express()
const winston = require('winston')
const expressWinston = require('express-winston')
const { queryDB, send } = require('./utils/influxdb')

// initialization
app.use(express.urlencoded({ extended: true }))
app.use(
  express.json({
    verify: (req, res, buf, encoding) => {
      try {
        JSON.parse(buf)
      } catch (e) {
        res.status(400).json({ status: false, message: 'Invalid payload provided.' })
      }
    },
  })
)

// logger
app.use(
  expressWinston.logger({
    transports: [
      new winston.transports.Console(),
      /*
    new winston.transports.File({
        filename: 'logs/influxdb_http.log'
    })
    */
    ],
    format: winston.format.combine(winston.format.colorize(), winston.format.json()),
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: 'HTTP {{req.method}} {{req.url}}', // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    ignoreRoute: function (req, res) {
      return false
    }, // optional: allows to skip some log messages based on request and/or response
  })
)
// main post listener
app.post('/', async (req, res) => {
  const json = req.body
  if (!json) {
    return res.status(400).json({ status: false, message: 'Payload structure is not valid.' })
  }
  if (typeof json.query === 'undefined') {
    return res.status(400).json({ status: false, message: 'Query not provided.' })
  }
  let result = false
  result = await queryDB(json.query)
  if (result instanceof Error) {
    return res
      .status(400)
      .json({ status: false, message: "There's been an error querying DB, please check your query" })
  }
  if (RUN_AS_STANDALONE !== 'no' || !EGRESS_URLS) {
    // parse data property, and update it
    return res.status(200).json({
      status: result !== null,
      data: result,
    })
  } else {
    await send({
      data: result,
    })
    return res.status(200).json({ status: true, message: 'Payload processed' })
  }
})

// handle exceptions
app.use(async (err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }
  const errCode = err.status || 401
  res.status(errCode).send({
    status: false,
    message: err.message,
  })
})

if (require.main === module) {
  app.listen(INGRESS_PORT, INGRESS_HOST, () => {
    console.log(`${MODULE_NAME} listening on ${INGRESS_PORT}`)
  })
}
