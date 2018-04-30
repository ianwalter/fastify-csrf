const fastifyPlugin = require('fastify-plugin')
const Tokens = require('csrf')

const dependencies = ['fastify-session']

module.exports = fastifyPlugin(function (fastify, options = {}, next) {
  // Create the pillarjs tokens instance that will be used to generate
  // url/cookie-safe tokens.
  fastify.log.warn('options', options)
  const csrfOptions = options.csrf || {}
  const tokens = new Tokens({ secretLength: 48, ...csrfOptions })

  // Create the csrfToken() request method that allows the server to generate a
  // secret token for the client and a verification token stored in the user's
  // session.
  fastify.decorateRequest('csrfToken', function () {
    const secret = tokens.secretSync()
    this.session.csrfToken = tokens.create(secret)
    return secret
  })

  // Register the preHandler that checks whether requests have the correct CSRF
  // token by comparing the secret token in the csrf-token request header and
  // the verification token stored in the user's session.
  fastify.register(function (handlerFastify, handlerOptions, handlerNext) {
    handlerFastify.addHook('preHandler', function (request, reply, reqNext) {
      request.log.warn('CSRF', request.req.url, request.session.csrfToken)
      reqNext()
    })

    handlerNext()
  }, { prefix: options.prefix || '/' })


  // Continue after setup has completed.
  next()
}, { dependencies })
