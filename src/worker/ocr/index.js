'use strict';

const bluebird = require('bluebird'),
  fs = bluebird.promisifyAll(require('fs')),
  tesseract = require('tesseract.js');

const sisypheOCR = {};

sisypheOCR.doTheJob = function(data, next) {
  // This module will conver+ocerise pdf or just ocerise png/jpef
  // Need a binding of pdftocairo poppler in popplonode first
  if (data.mimetype !== 'application/pdf' && data.mimetype !== 'image/jpeg') {
    return next(null,data)
  }
};

module.exports = sisypheOCR;