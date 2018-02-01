const cp = require("child_process");
const path = require("path")
function Overseer(options = {}) {
  return new Promise((resolve, reject) => {
    this.promiseManager = {resolve,reject}
    let execOptions = 
      this.options && 
      this.options.hasOwnProperty("debugMod") && 
      this.options.hasOwnProperty("debugPort") && 
      this.options.debugMod && this.options.debugPort 
        ? { execArgv: [`--inspect-brk=${(options.debugPort || 9444) + nbFork}`] } 
        : { execArgv: [] };
    this.worker = cp.fork(path.join(__dirname, 'Worker.js'), execOptions);
    const self = this
    this.worker.on("exit", function(code, signal) {
      if (signal === "SIGSEGV") {
        self.worker.kill('SIGKILL')
        self.worker = cp.fork(path.join(__dirname, "Worker.js"), execOptions);
        self.worker.send({
          type: "init",
          workerName: options.workerName,
          options: options.options
        });
        if (this.data) {
          this.data.error = 'Problem on module' + options.workerName + ':' + ' file seems corrupt'
          this.reject({error: 'SIGSEGV', data: this.data});
        }
        self.bindEvents(self.worker)
      }
    });
    this.bindEvents(this.worker)
    this.state = 'init'
    this.worker.send({ 
      type: 'init', 
      workerName: options.workerName,
      options:options.options
    })
  })
}

Overseer.prototype.send = function (data) {
  return new Promise((resolve, reject) => {
    this.state = "launch";
    this.promiseManager = { resolve, reject };
    this.worker.reject = reject
    this.worker.data = data
    this.worker.send({ type: "launch", data });
  })
}

Overseer.prototype.final = function(worker) {
  return new Promise((resolve, reject) => {
    this.state = "launch";
    this.promiseManager = { resolve, reject };
    this.worker.send({ type: "final", data: {} });
  });
};

Overseer.prototype.bindEvents = function(worker) {
  worker.on("message", msg => {
    if (msg && msg.type === "init") {
      this.init = true
      return this.promiseManager.resolve(this);
    }
    if (msg && msg.type === "launch") {
      return this.promiseManager.resolve(msg.data);
    }
    if (msg && msg.type === "final") {
      return this.promiseManager.resolve(msg.data);
    }
    if (msg && msg.type === "error") {
      if(this.state === 'init') this.quit()
      const error = new Error(msg.error.message);
      error.code = msg.error.code;
      error.stack = msg.error.stack;
      return this.promiseManager.reject(error);
    }
  });
}


Overseer.prototype.quit = function(worker) {
  return this.worker.kill("SIGKILL");
};


module.exports = Overseer;
