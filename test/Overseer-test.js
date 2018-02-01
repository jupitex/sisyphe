'use strict';

const pkg = require('../package.json');
const chai = require('chai');
const expect = chai.expect;
const Promise = require("bluebird");
const Overseer = require('../src/Overseer');
const _ = require('lodash')
const cp = require('child_process')
const path = require('path')

const Config = {
  worker: 'dumbWorker'
};

describe(`${pkg.name}/src/Overseer.js`, function () {
  describe("#init", function() {
    it("should initialize", async function() {
      const overseer = await new Overseer({ workerName: "dumbWorker" });
      expect(overseer).has.ownProperty("init");
      expect(overseer.init).equal(true);
      overseer.quit()
    });
    it("should not initialize when error in workerName", async function() {
      return new Overseer({ workerName: "dumbWorkerd" })
        .catch(function (error){
          expect(error).instanceOf(Error);
        })
    });
    it("should not initialize when no workerName", function(done) {
      new Overseer().catch(error => {
        expect(error).instanceOf(Error);
        done();
      });
    });
  });

  describe("#launch", function() {
    it("should launch", async function() {
      const overseer = await new Overseer({ workerName: "dumbWorker",options: {id:1} });
      const result = await overseer.send({})
      expect(result).has.ownProperty("id");
      expect(result.id).equal(1)
      overseer.quit()
    });
    it("should throw error when error in worker", function(done) {
      new Overseer({ workerName: "dumbWorker",options: {id:1, throw:true} }).then(overseer=>{
        overseer.send().catch(error=>{
          expect(error).instanceOf(Error);
          done()
          overseer.quit()
        })
      }).catch(err=>console.log(err));
    });
  });

  describe("#corruption", function() {
    it("should throw error on SIGSEGV", async function() {
      const overseer = await new Overseer({ workerName: "dumbWorker",options: {id:1, time:2000 }});
      overseer.worker.kill('SIGSEGV')
      await overseer.send({}).catch(err=>{
        expect(overseer.worker.signalCode).not.equal('SIGSEGV')
        expect(err).has.ownProperty("error");
        expect(err).has.ownProperty("data");
        expect(err.data).has.ownProperty("error");
        expect(err.data.error).equal("Problem on moduledumbWorker: file seems corrupt");
      })
      overseer.quit()
    });
  });

  describe("#final", function() {
    it("should final", async function() {
      const overseer = await new Overseer({ workerName: "dumbWorker",options: {id:1} });
      const result = await overseer.final()
      overseer.quit()
    });
    it("should throw error when error in worker", function(done) {
      new Overseer({ workerName: "dumbWorker",options: {id:1, throw:true} }).then(overseer=>{
        overseer.final().catch(error=>{
          expect(error).instanceOf(Error);
          done()
          overseer.quit()
        })
      }).catch(err=>console.log(err));
    });
  });
});
