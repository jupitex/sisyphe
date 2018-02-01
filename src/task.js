const Promise = require("bluebird");
const redis = require("redis");
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
const EventEmitter = require("events").EventEmitter;
const _ = require("lodash");

function Task(option) {
  EventEmitter.call(this);
  if (option.hasOwnProperty("port") && option.hasOwnProperty("host"))
    this.client = redis.createClient({ host: "127.0.0.1", port: 6379 });
  else this.client = redis.createClient();
  this.name = option.name;
  this.processResolve = []
  this.blProcess = 0
  this.nbProcess = 0
  this.nbProcessStop = 0
  this.active = 0
}
Task.prototype = Object.create(EventEmitter.prototype);

Task.prototype.flushall = function() {
  return this.client.flushallAsync();
};

Task.prototype.add = function(obj) {
  return this.client.lpushAsync(this.name, JSON.stringify(obj));
};

Task.prototype.get = function() {
  return this.client.blpopAsync(this.name, 0);
};

Task.prototype.quit = async function() {
  return new Promise(async (resolve, reject) => {
    await this.stopProcess();
    setTimeout(async () => {
      await this.client.end(false);
      resolve()
    }, 10);
  });
};

Task.prototype.stopProcess = async function() {
  for (var i = 0; i < this.blProcess; i++) {
    await this.add({endProcess:true})
  }
  this.processResolve.map(resolver=>{
    resolver.resolve()
    resolver.client.end(false)
  })
};
Task.prototype.getJobCount = async function() {
  return this.client.llenAsync(this.name).catch(err => console.log(err));
};

Task.prototype.debounce = function(time=500) {
  const interval = setInterval(async _=>{
    if (this.process_is_running && (await this.getJobCount()) === 0 && this.active === 0) {
      clearInterval(interval)
      this.emit('processEnd')
    }
  },time)
}

Task.prototype.process = function(fun, debounceTime) {
  // if (this.process_is_running){
  //   return this.processFunction
  // } 
  const self = this;
  const processClient = redis.createClient();
  this.process_is_running = true;
  return new Promise((resolve, reject) => {
    this.processResolve.push({resolve,client: processClient})
    const loop = function() {
      this.blProcess++
      return processClient.blpopAsync(self.name, 0).then(job => {
        this.blProcess--;
        job = JSON.parse(job[1]);
        if (job.hasOwnProperty("endProcess")) {
          return processClient.end(false)
        };
        self.active+=1;
        fun(job, done => {
          self.active-=1
          if (!self.process_is_running) return;
          loop();
        });
      });
    };
    loop();
    if (debounceTime) {
      self.debounce(debounceTime);
    }
  });
};

module.exports = Task;
