const Overseer = require('./Overseer')
const EventEmitter = require("events").EventEmitter;
const Promise = require('bluebird')

function Dispatcher(tasks, options = {}) {
  EventEmitter.call(this);
  this.options = options
  return new Promise(async (resolve, reject) => {
    const nbCpus = options.nbCpus ? options.nbCpus : 1;
    if(!options.name) return reject(new Error("Please specify a name for the overseer"))
    if(!tasks) return reject(new Error('Please specify a task for the overseer'))
    this.name = options.name
    this.waitingOverseers = []
    this.completed = 0
    this.active = 0
    const self = this
    let error = false
    for (var i = 0; i < nbCpus; i++) {
      const overseer = await new Overseer({ workerName: options.name, options })
        .catch(err=>error=err);
      // overseer.worker.on('exit', function(code,signal){
      //   if (signal === 'SIGSEGV') {
      //     self.recreateWorker(this)
      //   }
      // })
      this.waitingOverseers.push(overseer)
    }
    if(error) return reject(error)
    this.tasks = tasks
    resolve(this)
  })
}
Dispatcher.prototype = Object.create(EventEmitter.prototype);

Dispatcher.prototype.recreateWorker = async function(worker) {
  const self = this
  const overseer = await new Overseer({ workerName: this.options.name, options: this.options })
    .catch(err=>error=err);
  console.log('recreate')
  this.waitingOverseers.push(overseer)
}

Dispatcher.prototype.quit = async function() {
  await this.tasks.quit()
  await Promise.map(this.waitingOverseers, overseer => {
    return overseer.quit();
  })
  
}

Dispatcher.prototype.launch = function() {
  return new Promise(async (resolve, reject) => {
    this.tasks.on("processEnd", async _ => {
      const jobsCount = await this.tasks.getJobCount();
      return resolve();
    });
    let nbProcess = 0;
    await Promise.map(this.waitingOverseers, (overseer,index)=>{
      return this.tasks.process(async (data, done) => {
        overseer = this.waitingOverseers.pop()
        const result = await overseer.send(data).catch(async err => err.data);
        this.emit('completed', {
          completed: ++this.completed,
          active: this.active,
          result
        })
        this.waitingOverseers.push(overseer)
        done();
      }, 40);
    }).catch(err=>{
      console.log('lkkjlj',err)
    })
  }).then(_=>{
    // call one finalJob by dispatcher on end
    return this.waitingOverseers[0].final()
  });
}
module.exports = Dispatcher