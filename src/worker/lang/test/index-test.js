'use strict';

const fs = require('fs'),
  pkg = require('../package.json'),
  sisypheLangDetect = require('../index.js'),
  expect = require('chai').expect;

describe(pkg.name + '/index.js', function() {
  this.timeout(10000)
  describe('#doTheJob', function() {
    it('Should detect a lang in a plain text file', function(done) {
      let testTxt = {
        "path": "test/data/test.txt",
        "mimetype": "text/plain"
      };
      sisypheLangDetect.doTheJob(testTxt, (error, data) => {
        if (error) {
          done(error);
        } else {
          expect(data.langDetect).to.have.property('reliable');
          expect(data.langDetect).to.have.property('languages');
          done();
        }
      })
    });
    it('Should detect a lang in a german text file', function(done) {
      let testGerman = {
        "path": "test/data/test2.txt",
        "mimetype": "text/plain"
      };
      sisypheLangDetect.doTheJob(testGerman, (error, data) => {
        if (error) {
          done(error);
        } else {
          expect(data.langDetect).to.have.property('reliable');
          expect(data.langDetect).to.have.property('languages');
          expect(data.langDetect.languages).to.be.an('array');
          expect(data.langDetect.languages[0]).to.have.property('name');
          expect(data.langDetect.languages[0].name).to.equal('GERMAN');
          done();
        }
      });
    });
    it('Should not crash on an empty file & return reliable false', function(done) {
      let testGerman = {
        "path": "test/data/test-empty.txt",
        "mimetype": "text/plain"
      };
      sisypheLangDetect.doTheJob(testGerman, (error, data) => {
        if (error) {
          done(error);
        } else {
          expect(data.langDetect).to.have.property('reliable');
          expect(data.langDetect.reliable).to.be.false;
          done();
        }
      });
    });
    it('Should not crash on an empty file', function(done) {
      let testGerman = {
        "path": "test/data/test-of-doom.txt",
        "mimetype": "text/plain"
      };
      sisypheLangDetect.doTheJob(testGerman, (error, data) => {
        if (error) {
          done(error);
        } else {
          expect(data).to.have.property('langDetectError');
          expect(data.langDetectError).to.be.an('object');
          expect(data.langDetectError).to.have.property('message');
          expect(data.langDetect).to.have.property('reliable');
          expect(data.langDetect.reliable).to.be.false;
          done();
        }
      });
    });
    it('Should detect russian lang in xml file', function(done) {
      let testGerman = {
        "path": "test/data/test.xml",
        "mimetype": "application/xml"
      };
      sisypheLangDetect.doTheJob(testGerman, (error, data) => {
        if (error) {
          done(error);
        } else {
          expect(data.langDetect).to.have.property('reliable');
          expect(data.langDetect).to.have.property('languages');
          expect(data.langDetect.languages).to.be.an('array');
          expect(data.langDetect.languages[0]).to.have.property('name');
          expect(data.langDetect.languages[0].name).to.equal('RUSSIAN');
          done();
        }
      });
    });
  })
});
