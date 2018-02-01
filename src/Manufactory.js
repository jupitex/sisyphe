const Dispatcher = require("./Dispatcher");
const os = require('os')
const Promise = require('bluebird')
const Task = require('./task')
const path = require('path')
const EventEmitter = require("events").EventEmitter;

/**
 * @param {Object} options Options for dispatcher
 * @param {String} options.corpusName Corpus name
 * @param {String} options.configDir Path to config
 * @param {Number} options.numCPUs Number of cpu to use
 * @param {Number} options.now Session start
 * @param {String} options.outputPath Where to put results
 * @returns {Manufactory}
 */
function Manufactory(options = {}) {
  EventEmitter.call(this);  
  return (async _ => {
    if (!options.hasOwnProperty("workers")) throw new Error("Please specify an workers property containing an array of workers");
    this.pathToAnalyze = options.inputPath ? options.inputPath : path.resolve('.')
    this.dispatchers = []
    this.nbFiles = 0
    const nbCpus = options.nbCpus ? options.nbCpus : os.cpus().length
    await Promise.each(options.workers, async workerName=>{
      const task = new Task({name: workerName})
      const dispatcher = await new Dispatcher(task, {
        name: workerName,
        nbCpus,
        outputPath: options.outputPath
      })
      this.dispatchers.push(dispatcher)
    })
    this.currentDispatcher = this.dispatchers[0];
    return this
  })()
}
Manufactory.prototype = Object.create(EventEmitter.prototype);

Manufactory.prototype.launch = async function() {
  this.dispatchers[0].on('completed', data=>{
    if (!data.hasOwnProperty('result')) return;
    if (data.result.hasOwnProperty('directories')) {
      Promise.map(data.result.directories, directory=>{
        return this.dispatchers[0].tasks.add({ directory });
      })
    }
    if (data.result.hasOwnProperty('files')) {
      this.nbFiles += data.result.files.length
      Promise.map(data.result.files, file=>{
        if (this.dispatchers[1]) return this.dispatchers[1].tasks.add(file);
      })
    }
  })
  await this.currentDispatcher.tasks.add({ directory: this.pathToAnalyze });
  await this.currentDispatcher.launch()
  this.emit('dispatcherEnd', this.dispatchers[0])


  return Promise.each(this.dispatchers, (dispatcher, index)=>{
    if (index===0) return
    this.currentDispatcher = dispatcher
    dispatcher.on('completed', (data)=>{
      if (this.dispatchers[index+1]) 
        this.dispatchers[index+1].tasks.add(data.result);
    })
    return dispatcher.launch().then(_=>{
      this.emit('dispatcherEnd', this.currentDispatcher)
    })
  })
}

Manufactory.prototype.quit = function () {
  return Promise.map(this.dispatchers,dispatcher=>{
    return dispatcher.quit()
  })
}


module.exports = Manufactory;
