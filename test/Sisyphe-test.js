"use strict";

const pkg = require("../package.json");
const chai = require("chai");
const expect = chai.expect;
const Promise = require("bluebird");
const _ = require("lodash");
const fs = require("fs");
const cp = require("child_process");
const path = require("path");
const Sisyphe = require("../sisyphe");

const badConfs = [
  { silent: true },
  { corpusname: "ded", silent: true },
  { corpusname: "ded", workers: ["walker-fs"], silent: true },
  { corpusname: "ded", workers: ["walker-fs"], inputPath: "./data", silent: true },
  { corpusname: "ded", workers: ["workerThatNotExist"], inputPath: "./test/data", silent: true , outputPath:'./output' },
];
const goodConf = {
  corpusname: "ded",
  workers: ["walker-fs", "xpath"],
  inputPath: path.resolve(__dirname, "data"),
  outputPath: path.resolve(__dirname, "output"),
  silent: true
};

describe(`${pkg.name}/sisyphe.js`, function() {
  this.timeout(30000);
  describe("#init", function() {
    it("should initialize", async function() {
      const sisyphe = await new Sisyphe(goodConf);
      sisyphe.exit();
    });

    it("should not initialize when missing parameters", async function() {
      return Promise.map(badConfs, async conf => {
        return new Sisyphe(conf).catch(err => false).then(sisyphe => {
          if (sisyphe) {
            sisyphe.exit();
            throw new Error("It must not initialize Sisyphe");
          }
        });
      });
    });
  });
  describe("#launch", function() {
    it("should launch", async function() {
      const sisyphe = await new Sisyphe(goodConf);
      return sisyphe.launch();
    });
  });
  describe("#getCurrentModule", function() {
    it("should get the firstModule", async function() {
      const sisyphe = await new Sisyphe(goodConf);
      expect(sisyphe.getCurrentModule()).equal(goodConf.workers[0]);      
      await sisyphe.launch();
      expect(sisyphe.getCurrentModule()).equal(goodConf.workers[goodConf.workers.length - 1])
    });
  });
});
