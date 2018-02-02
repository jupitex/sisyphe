"use strict";

const pkg = require("../package.json");
const chai = require("chai");
const expect = chai.expect;
const Promise = require("bluebird");
const Dispatcher = require("../src/Dispatcher");
const Overseer = require("../src/Overseer");
const Manufactory = require("../src/Manufactory");
const _ = require("lodash");
const cp = require("child_process");
const path = require("path");
const Task = require("../src/task");

describe(`${pkg.name}/src/Manufactory.js`, function() {
  this.timeout(20000);
  describe("#init", function() {
    it("should initialize", async function() {
      const manufactory = await new Manufactory({ workers: ["dumbWorker"] });
      expect(manufactory).has.ownProperty("dispatchers");
      expect(manufactory.dispatchers).length(1);
      expect(manufactory.dispatchers[0]).instanceof(Dispatcher);
      manufactory.quit();
    });
  });
  describe("#launch", function() {
    it("should launch", async function() {
      const manufactory = await new Manufactory({
        workers: ["walker-fs", "filetype", "out"],
        inputPath: "./test/data"
      });
      await manufactory.launch();
      manufactory.quit();
    })
  });
  describe("#corruption", function() {
    it("should process all task", async function() {
      const manufactory = await new Manufactory({
        workers: ["walker-fs", "filetype", "pdf","xml", "out"],
        inputPath: "./test/data"
      });
      await manufactory.launch();
      manufactory.quit()
    });
  });
});
