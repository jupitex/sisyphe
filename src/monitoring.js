const bluebird = require('bluebird');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);


/**
 * Manage and dispatch all logs
 * @constructor
 */
function monitoring () {
  this.log= {
    error: [],
    warning: [],
    info: []
  },
  this.workersError= []
  this.client = redis.createClient();
  this.client.on("error", err => {
    // nothing because sisyphe manage already connection
  });
}
/**
 * Send a log in redis
 * @param {String} type Type of the log (info, warning, etc...)
 * @param {String} string Description of the log
 */
monitoring.prototype.updateLog = async function (type, string) {
  if (
    (string.hasOwnProperty('message') &&
    string.hasOwnProperty('stack')) ||
    type === 'error'
  ) return this.updateError(string);
  this.log[type].push(string);
  await this.client.hsetAsync(
    'monitoring',
    'log', JSON.stringify(this.log)
  );
};

/**
 * Format and send an error log in redis
 * @param {String|Object} err Error to send in redis
 */
monitoring.prototype.updateError = async function (err) {
  const redisError = {
    message: 'Unknown error',
    stack: '',
    infos: 'No information',
    time: Date.now()
  };
  if (err.hasOwnProperty('message')) redisError.message = err.message;
  if (err.hasOwnProperty('infos')) redisError.infos = err.infos;
  if (err.hasOwnProperty('stack')) redisError.stack = err.stack;
  if (typeof err === 'string') redisError.message = err;

  if (err.hasOwnProperty('infos') && err.infos.hasOwnProperty('path')) this.workersError.push(redisError);
  this.log['error'].push(redisError);

  await this.client.hmsetAsync(
    'monitoring',
    'log', JSON.stringify(this.log),
    'workersError', JSON.stringify(this.workersError)
  );
};

monitoring.prototype.quit = function () {
  this.client.quit()
}

module.exports = monitoring;
