
const path = require('path')
const fse= require('fs-extra')
let worker

function sendError(error) {
  process.send({ 
    type: "error", 
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code
    }
  });
}

process.on('message', async function (msg) {
  if(msg && msg.hasOwnProperty('type')){
    switch (msg.type) {
      case "init":
        try { worker = new Worker(msg) } 
        catch (error) { return sendError(error) }
        this.send({ type:'init'})
        break;
      case "launch":
        worker
          .launch(msg.data)
          .then(data=>this.send({type: 'launch', data}))
          .catch(error=>{ return sendError(error) })
          break; 
      case "final":
        worker
          .final(msg.data)
          .then(data=>this.send({type: 'final', data}))
          .catch(error=>{ return sendError(error) })
          break; 
      default:
        break;
    }
  }
})


function Worker(options) {
  if (!options.workerName) throw new Error('No name to find a worker') 
  this.performer = require(path.join(__dirname, "worker", options.workerName));
  if (this.performer && this.performer.hasOwnProperty('init'))
    this.performer.init(options.options)
}

Worker.prototype.launch = function(data) {
  return new Promise((resolve, reject) => {
    return this.performer.doTheJob(data, (error, data) => {
      if (error) return reject(error);
      resolve(data);
    });
  })
};

Worker.prototype.final = function() {
  return new Promise((resolve, reject) => {
    if (!this.performer.finalJob) resolve();
    this.performer.finalJob(error => {
      if (error) return reject(error);
      resolve();
    });
  });
};


module.exports = Worker;
