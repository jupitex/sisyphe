'use strict';

const sisypheOut = {};
const Winston = require('winston');
const mkdirp = require("mkdirp");
const path = require('path');
sisypheOut.init = function (options) {
  this.outputPath = options.outputPath || 'out/no-output-specified';
  mkdirp.sync(this.outputPath);
  this.fileLog = this.outputPath + `/analyse.json`
  this.logger = new Winston.Logger();
  this.logger.configure({
    exitOnError: false,
    transports: [
      new Winston.transports.File({
        filename: this.fileLog,
        highWaterMark: 24,
        json: true,
        level: 'debug'
      })
    ]
  });
  return this;
};

sisypheOut.doTheJob = function (data, next) {
  this.logger.info(data, function (error, level, msg, meta) {
    if (error) return next(error);
    next(null, msg);
  });
};

module.exports = sisypheOut;
