'use strict';

const pkg = require('../package.json');
const chai = require('chai');
const expect = chai.expect;
const Promise = require("bluebird");
const Dispatcher = require('../src/Dispatcher');
const Overseer = require('../src/Overseer')
const _ = require('lodash')
const cp = require('child_process')
const path = require('path')
const Task = require("../src/task");


const Config = {
  worker: 'dumbWorker'
};

describe(`${pkg.name}/src/Dispatcher.js`, function () {

  describe("#init", function() {
    it("should initialize", async function() {
      const task = new Task({name: 'init-dispatcher'})
      const dispatcher = await new Dispatcher(task, {name: 'filetype',nbCpus: 4})
      expect(dispatcher).has.ownProperty("waitingOverseers");
      expect(dispatcher).has.ownProperty('tasks');

      expect(dispatcher.waitingOverseers).has.length(4);
      dispatcher.waitingOverseers.map(overseer => {
        expect(overseer).instanceOf(Overseer);
      });
      dispatcher.quit()
      dispatcher.tasks.quit()
    });
    it("should not initialize when problem in worker name", function(done) {
      const tasks = new Task({ name: "init-dispatcher" });
      new Dispatcher(tasks, { name: "dumbWrker" }).catch(err => {
        expect(err).instanceOf(Error);
        tasks.quit();
        done();
      });
    });
    it("should not initialize when there is no task", function(done) {
      new Dispatcher(null , { name: "dumbWrker" }).catch(err => {
        expect(err).instanceOf(Error);
        done();
      });
    });
  });
  describe("#launch", function() {
    this.timeout(100000)
    it("should launch dispatcher", async function() {
      const task = new Task({name: 'init-dispatcher'})
      await task.flushall()
      const dispatcher = await new Dispatcher(task, {name: 'dumbWorker',nbCpus: 4, id:1})
      dispatcher.on('completed', data=>{
        expect(data).has.ownProperty("completed");
        expect(data).has.ownProperty("active");
        expect(data).has.ownProperty("result");
        expect(data.result).has.ownProperty("id");
        expect(data.result.id).equal(1)
      })
      for (var i = 0; i < 10; i++) {
        await task.add({ id: i, data: Math.random(),datas: Math.random() });
      }
      await dispatcher.launch()
      await dispatcher.quit()
      expect(dispatcher.completed).equal(10);
    });
  });
  describe("#corruption", function() {
    this.timeout(100000)
    it("should launch dispatcher", async function() {
      const task = new Task({name: 'init-dispatcher'})
      await task.flushall()
      const dispatcher = await new Dispatcher(task, {name: 'dumbWorker',nbCpus: 4, id:1})
      for (var i = 0; i < 4; i++) {
        await task.add({ id: 2, data: Math.random(),datas: Math.random(), time:i*1000 });
      }
            
      dispatcher.on('completed', data=>{
        expect(data).has.ownProperty("completed");
        expect(data).has.ownProperty("active");
        expect(data).has.ownProperty("result");
        expect(data.result).has.ownProperty("error");
        expect(data.result.error).equal("Problem on moduledumbWorker: file seems corrupt");
        expect(data.result).has.ownProperty("id");
        expect(data.result.id).equal(2);
      })
      const snapshotWaitingOverseers = []
      dispatcher.waitingOverseers.map(overseer=>snapshotWaitingOverseers.push(overseer))
      Promise.map(snapshotWaitingOverseers, overseer => overseer.worker.kill("SIGSEGV"));
      await dispatcher.launch().catch(err=>console.log(err))
      expect(dispatcher.completed).equal(4);
      dispatcher.quit()
      snapshotWaitingOverseers.map(overseer => {
        overseer.quit();
      });
    });
  });
});
