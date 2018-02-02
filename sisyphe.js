const Promise = require("bluebird");
const redis = require("redis");
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const cp = require('child_process')
const Manufactory = require('./src/Manufactory');
const workersConf = require(path.resolve(__dirname, 'src', 'worker.json')).workers;
let redisProcess; // fill this variable if redis is launch by process to kill him later
const Monitoring = require('./src/monitoring');
/**
 * EntryPoint to Sisyphe
 * @constructor
 */
const sisyphe = {};

/**
 * Init Sisyphe and all components
 * @param {Array.<String>} workers Array with the name of workers
 */
function Sisyphe(session = {}) {
  const self = this
  return (async _ => {
    //  Test requirements
    this.session = session;
    if (!this.session.hasOwnProperty('corpusname')) { throw new Error('please specify corpusname in the argument object'); }
    if (!this.session.hasOwnProperty('workers')) { throw new Error('please specify workers in the argument object'); }
    if (!this.session.hasOwnProperty('inputPath')) { throw new Error('please specify inputPath in the argument object'); }
    if (!this.session.hasOwnProperty('outputPath')) { throw new Error('please specify outputPath in the argument object'); }
    
    if(!fs.existsSync(this.session.inputPath)) { throw new Error('inputPath doesn\'t exists'); }
    // init redis connection
    this.client = redis.createClient();
    this.client.on("error", err => {
      if (err.code === "ECONNREFUSED") this.launchRedis();
    });
    this.monitoring = new Monitoring()

    // Test if each worker existing on the worker.json
    this.session.workers.map(worker => {
      if (!workersConf.includes(worker)) { throw new Error(`${worker} doesn't exist`); }
    });

    this.session.pathToConf = null;
    this.session.configFilename = "sisyphe-conf.json";
    this.session.sharedConfigDir = this.session.configDir ? path.resolve(this.session.configDir, "shared") : null; // standard path for the shared configuration directory
    // We search the nearest config in configDir
    const confContents = this.session.configDir ? fs.readdirSync(this.session.configDir) : []; // confContent have to be an emtpty array if confDir is not define
    for (let folder of confContents) {
      let currPath = path.join(this.session.configDir, folder);
      if (fs.lstatSync(currPath).isDirectory() && this.session.corpusname.includes(folder)) {
        this.session.pathToConf = path.resolve(this.session.configDir, folder, this.session.configFilename);
        break;
      }
    }
    this.session.config = fs.existsSync(this.session.pathToConf)
      ? require(this.session.pathToConf)
      : null; // Object representation of sisyphe configuration (or null)
    if (!this.session.hasOwnProperty('now')) this.session.now = Date.now();
    if (!this.session.hasOwnProperty('silent')) this.session.silent = false;
    await this.client.flushallAsync();
    await this.client.hmsetAsync(
      'monitoring',
      'start', this.session.now,
      'workers', this.session.workers.toString(),
      'corpusname', this.session.corpusname
    );
    this.enterprise = await new Manufactory(this.session);
    await this.monitoring.updateLog('info', 'Initialisation OK');
    this.updateConsole('info', '┌ All workers have been initialized')
    return self;
  })().catch(err => this.exit(err));
};

/**
 * Launch sisyphe
 */
Sisyphe.prototype.launch = async function() {
  this.enterprise.nbFiles = 0
  this.enterprise.dispatchers[0].on('completed',data=>{
    setTimeout(()=> {
      this.client.hset('monitoring', 'maxFiles', this.getNbFiles())
    }, 10);
  })
  this.enterprise.on("dispatcherEnd", async dispatcher => {
    setTimeout(()=> {
      this.client.hset('monitoring', 'currentModule', this.getCurrentModule())
    }, 10);
    this.updateConsole("info", "├─ " + dispatcher.name + " has finished");
    await this.monitoring.updateLog("info", dispatcher.name + " has finished");
  });
  await this.enterprise.launch().catch(err=>this.exit(err))
  this.updateConsole("info", "└ All workers have finished");
  await this.monitoring.updateLog("info", "All workers have finished");
  await this.enterprise.quit()
  this.exit()
};

Sisyphe.prototype.launchRedis = function() {
  let pathToRedisServer;
  const os = require("os");

  if (os.platform() === "linux")       pathToRedisServer = path.resolve(__dirname, "lib", "redis-linux-64", "src", "redis-server");
  else if (os.platform() === "darwin") pathToRedisServer = path.resolve(__dirname, "lib", "redis-darwin-64", "src", "redis-server");
  else if (os.platform() === "win32")  pathToRedisServer = path.resolve(__dirname, "lib", "redis-win-64", "src", "redis-server");
  else console.log('No Redis detected and it can\'t launch on this platform. Please launch a redis manually')
  
  if (pathToRedisServer) redisProcess = cp.spawn(pathToRedisServer);
}

Sisyphe.prototype.getNbFiles = function() {
  return this.enterprise.nbFiles
};
Sisyphe.prototype.getCurrentModule = function() {
  return this.enterprise.currentDispatcher.name;
};

Sisyphe.prototype.exit = async function (err) {
  if (redisProcess) redisProcess.kill("SIGTERM");
  if (this.client) {
    await this.client.hmsetAsync('monitoring', 'end', Date.now());
    await this.client.quit()
  }
  if (this.monitoring) {
    this.monitoring.quit()
    if (err) await this.monitoring.updateError(err);
  }
  if(!this.session.silent) console.log('Exiting...');
  if (err) {
    throw new Error(err);
  }
  if (this.enterprise) {
    await this.enterprise.quit()
  }
  return this
};

Sisyphe.prototype.updateConsole = function(type,msg) {
  if(type === 'error' && this.session.silent) return console.error(msg)
  if(!this.session.silent) console.log(msg)
}

module.exports = Sisyphe;


process.on("SIGTERM", async _=>{
  const client = redis.createClient()
  await client.hmsetAsync('monitoring', 'end', Date.now());
  await client.quit()
  process.exit(0)
});

process.on("unhandledPromiseRejection", (err, p) => {
  console.log("An unhandledRejection occurred");
  console.log(`Rejected Promise: ${p}`);
  console.log(`Rejection: ${err}`);
});
process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
  // application specific logging, throwing an error, or other logic here
});