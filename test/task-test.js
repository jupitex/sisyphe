'use strict';

const pkg = require('../package.json');
const chai = require('chai');
const expect = chai.expect;
const Promise = require("bluebird");
const redis = require("redis");
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
const Task = require('../src/task');


beforeEach(async function() {
  const flushClient = redis.createClient();
  await flushClient.flushallAsync()
  flushClient.quit()
});

describe(`${pkg.name}/src/task.js`, function () {
  describe('#init', function () {
    it('should be initialized successfully', async function () {
      const docs = new Task({ name: "test-task-init" });
      const ping = await docs.client.pingAsync()
      expect(ping).equal('PONG')
      expect(docs).to.be.instanceOf(Task);
      expect(docs.name).to.be.an('string');
      expect(docs.client).to.be.an('object');
      expect(docs.client).to.be.an.instanceof(redis.RedisClient);
      docs.quit()
    });

    it('should be initialized successfully whith host and port', async function () {
      const docs = new Task({
        name: 'test-task-init2',
        host: '127.0.0.1',
        port: '6379'
      });
      const ping = await docs.client.pingAsync()
      expect(ping).equal('PONG')
      expect(docs).to.be.instanceOf(Task);
      expect(docs.name).to.be.an('string');
      expect(docs.client).to.be.an('object');
      expect(docs.client).to.be.an.instanceof(redis.RedisClient);
      docs.quit()
    });
  });

  describe('#add', function () {
    let client;
    let docs
    beforeEach(function(){
      client = redis.createClient();
      docs = new Task({ name: "test-task-init" });
    })
    afterEach(function(){
      client.quit()
      docs.quit()
    })
    it("should add some task", async function() {
      await docs.add({ addTest: true });
      const job = JSON.parse(await client.lpopAsync("test-task-init"));
      expect(job).to.be.an("object");
      expect(job).has.ownProperty("addTest");
    });
    it("should add a boolean", async function() {
      await docs.add({ addTest: true });
      const job = JSON.parse(await client.lpopAsync("test-task-init"));
      expect(job.addTest).to.be.a("boolean");
    });
    it("should add a string", async function() {
      await docs.add({ addTest: "true" });
      const job = JSON.parse(await client.lpopAsync("test-task-init"));
      expect(job.addTest).to.be.a("string");
    });
    it("should add a number", async function() {
      await docs.add({ addTest: 1 });
      const job = JSON.parse(await client.lpopAsync("test-task-init"));
      expect(job.addTest).to.be.a("number");
    });
    it("should add a Object", async function() {
      await docs.add({ addTest: { a: true } });
      const job = JSON.parse(await client.lpopAsync("test-task-init"));
      expect(job.addTest).to.be.a("object");
    });
    it("should add a Array", async function() {
      await docs.add({ addTest: [0,2]});
      const job = JSON.parse(await client.lpopAsync("test-task-init"));
      expect(job.addTest).to.be.a("array");
    });
  });

  describe("#getJobCount", function() {
    it("should 8 jobs", async function() {
      const docs = new Task({ name: "test-task-init" });
      for (var i = 0; i < 8; i++) {
        await docs.add({ id: i, data: Math.random() });
      }
      const jobsCount = await docs.getJobCount();
      expect(jobsCount).to.be.a("number");
      expect(jobsCount).equal(8);
      docs.quit()
    });
  });

  describe("#process", function() {
    this.timeout(300000);
    it("should process rapid tasks", async function() {
      const docs = new Task({ name: "test-task-init" });
      return new Promise(async (resolve, reject) => {
        for (var i = 0; i < 10000; i++) {
          await docs.add({ id: i, data: Math.random() });
        }
        docs.on("processEnd", async _ => {
          const jobsCount = await docs.getJobCount()          
          await docs.quit();
          try {
            expect(jobsCount).equal(0)
            return resolve()
          } catch (error) {
            return reject(error)
          }
        });
        let nbProcess = 0;
        await docs.process((data, done) => {
          nbProcess++;
          done();
        }, 40);
      });
    });

    it("should process long tasks", async function() {
      const docs = new Task({ name: "test-task-init" });      
      return new Promise(async (resolve, reject) => {
        for (var i = 0; i < 10; i++) {
          await docs.add({ id: i, data: Math.random() });
        }
        docs.on("processEnd", async _ => {
          const jobsCount = await docs.getJobCount()
          await docs.quit()
          try {
            expect(jobsCount).equal(0)
            return resolve()
          } catch (error) {
            return reject(error)
          }
        });
        let nbProcess = 0;
        await docs.process((data, done) => {
          nbProcess++;
          setTimeout(_=>{
            done();
          },100)
        }, 40);
      });
    });
  });
});
