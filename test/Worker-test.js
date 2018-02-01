'use strict';

const pkg = require('../package.json');
const chai = require('chai');
const expect = chai.expect;
const Promise = require("bluebird");
const Worker = require('../src/Worker');
const _ = require('lodash')
const cp = require('child_process')
const path = require('path')

const Config = {
  worker: 'dumbWorker'
};

describe(`${pkg.name}/src/Worker.js`, function () {
  let config
  let fork
  beforeEach(function() {
    config = _.cloneDeep(Config);
    fork = cp.fork("src/Worker.js");
  })
  afterEach(function() {
    fork.kill('SIGTERM')
  });

  describe("#init", function() {
    it("should receive error when no workername", function(done) {
      fork.send({ type: "init" });
      fork.on("message", msg => {
        expect(msg).has.ownProperty("type");
        expect(msg).has.ownProperty("error");
        expect(msg.type).equal("error");
        expect(msg.error).has.ownProperty("message");
        expect(msg.error).has.ownProperty("stack");
        done();
      });
    });
    it("should receive error when workername is wrong", function(done) {
      fork.send({ type: "init", workername:"lregerkjg"});
      fork.on("message", msg => {
        expect(msg).has.ownProperty("type");
        expect(msg).has.ownProperty("error");
        expect(msg.type).equal("error");
        expect(msg.error).has.ownProperty("message");
        expect(msg.error).has.ownProperty("stack");
        done();
      });
    });
    it("should initialize", function(done) {
      fork.send({ type: "init", workerName: "dumbWorker" });
      fork.on("message", msg => {
        expect(msg).has.ownProperty("type");
        expect(msg.type).equal("init");
        done();
      });
    });
  });

  describe("#launch", function() {
    it("should launch correctly", function(done) {
      fork.send({ type: "init", workerName: "dumbWorker", options:{id:1}});
      fork.on("message", msg => {
        if (msg && msg.type === "init") {
          fork.send({ type: "launch", data:{} });
        }
        expect(msg).has.ownProperty("type");
        if (msg && msg.type === "launch") {
          expect(msg).has.ownProperty("data");
          expect(msg.data).has.ownProperty("id");
          expect(msg.data.id).equal(1);
          done();
        }
      });
    });

    it("should receive an error when problem in worker", function(done) {
      fork.send({ type: "init", workerName: "dumbWorker" });
      fork.on("message", msg => {
        if (msg && msg.type === "init") {
          fork.send({ type: "launch"});
        }
        if (msg && msg.type === "error") {
          expect(msg).has.ownProperty("type");
          expect(msg).has.ownProperty("error");
          expect(msg.type).equal("error");
          expect(msg.error).has.ownProperty("message");
          expect(msg.error).has.ownProperty("stack");
          done();
        }
      });
    });

    it("should receive an error when worker is wrong", function(done) {
      fork.send({ type: "init", workerName: "fileteeffzype" });
      fork.on("message", msg => {
        if (msg&&msg.hasOwnProperty('init')) {
          fork.send({ type: "launch" });
        }
        if (msg && msg.type === "error") {
          expect(msg).has.ownProperty("type");
          expect(msg).has.ownProperty("error");
          expect(msg.type).equal("error");
          expect(msg.error).has.ownProperty("message");
          expect(msg.error).has.ownProperty("stack");
          done();
        }
      });
    });
  });

  describe("#final", function() {
    it("should final correctly", function(done) {
      fork.send({ type: "init", workerName: "dumbWorker" });
      fork.on("message", msg => {
        if (msg.type === "init") {
          fork.send({ type: "launch", data: {} });
        }
        if (msg.type === "launch") {
          fork.send({ type: "final" });
        }
        if (msg.type === "final") {
          expect(msg).has.ownProperty("type");
          expect(msg.type).equal("final");
          done();
        };
      });
    });

    it("should receive an error when problem in worker", function(done) {
      fork.send({ type: "init", workerName: "dumbWorker" });
      fork.on("message", msg => {
        if (msg && msg.type === "init") {
          fork.send({ type: "launch" , options:{throw: true}});
        }  
        if (msg && msg.type === "launch") {
          fork.send({ type: "final" });
        }    
        if (msg && msg.type === "error") {
          expect(msg).has.ownProperty("type");
          expect(msg).has.ownProperty("error");
          expect(msg.type).equal("error");
          expect(msg.error).has.ownProperty("message");
          expect(msg.error).has.ownProperty("stack");
          done();
        }
      });
    });
  });
});
