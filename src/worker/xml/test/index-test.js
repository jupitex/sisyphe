'use strict';

const chai = require('chai'),
  exec = require('child_process').exec,
  path = require('path'),
  DOMParser = require('xmldom').DOMParser,
  expect = chai.expect,
  sisypheXml = require('../index.js');

const baseDoc = {
  corpusname: 'default',
  mimetype: 'application/xml',
  startAt: 1479731952814,
  extension: '.xml',
  name: 'test-default.xml',
  size: 123
};

const doc = Object.assign({path: __dirname + '/data/test-default.xml'}, baseDoc);
const docWithBadDoctypeInXml = Object.assign({path: __dirname + '/data/test-bad-doctype.xml'}, baseDoc);
const docWithNotWellFormedXml = Object.assign({path: __dirname + '/data/test-not-wellformed.xml'}, baseDoc);
const docWithUnknownDoctype = Object.assign({path: __dirname + '/data/test-unknown-doctype.xml'}, baseDoc);
const docWithNotValidXml = Object.assign({path: __dirname + '/data/test-not-valid-dtd.xml'}, baseDoc);


describe('doTheJob', function () {
  const testSisypheXml = Object.create(sisypheXml);
  testSisypheXml.init({configDir: path.resolve(__dirname, '../conf'), corpusname: 'default'});

  it('should add some info about a wellformed XML and valid DTD', function (done) {
    testSisypheXml.doTheJob(doc, (error, docOutput) => {
      if (error) return done(error);
      expect(docOutput).to.have.property('isWellFormed');
      expect(docOutput.isWellFormed).to.be.a('boolean');
      expect(docOutput).to.have.property('doctype');
      expect(docOutput.doctype).to.be.a('object');
      expect(docOutput.doctype).to.have.property('name', 'article');
      expect(docOutput.doctype).to.have.property('sysid', 'mydoctype.dtd');
      expect(docOutput.doctype).to.have.property('pubid', 'my doctype of doom');
      expect(docOutput).to.have.property('isValidAgainstDTD');
      expect(docOutput.isValidAgainstDTD).to.be.true;
      expect(docOutput.doctype.sysid).to.be.a('string');
      expect(docOutput).to.have.property('someInfosIsValid');
      expect(docOutput.someInfosIsValid).to.be.false;
      expect(docOutput).to.have.property('someInfosError');
      expect(docOutput).to.have.property('someInfosOkIsValid');
      expect(docOutput.someInfosOkIsValid).to.be.true;
      done();
    });
  });

  it('should add some info about a not wellformed XML', function (done) {
    testSisypheXml.doTheJob(docWithNotWellFormedXml, (error, docOutput) => {
      if (error) return done(error);
      expect(docOutput).to.have.property('isWellFormed');
      expect(docOutput.isWellFormed).to.be.a('boolean');
      done();
    });
  });

  it('should add some info about a XML whith bad doctype', function (done) {
    testSisypheXml.doTheJob(docWithBadDoctypeInXml, (error, docOutput) => {
      if (error) return done(error);
      expect(docOutput).to.have.property('isWellFormed');
      expect(docOutput.isWellFormed).to.be.a('boolean');
      done();
    });
  });

  it('should add some info about a XML whith an unknown doctype but valid after all', function (done) {
    testSisypheXml.doTheJob(docWithUnknownDoctype, (error, docOutput) => {
      if (error) return done(error);
      expect(docOutput).to.have.property('isWellFormed');
      expect(docOutput.isWellFormed).to.be.a('boolean');
      done();
    });
  });

  it('should add some info about a not valid XML', function (done) {
    testSisypheXml.doTheJob(docWithNotValidXml, (error, docOutput) => {
      if (error) return done(error);
      expect(docOutput).to.have.property('isWellFormed');
      expect(docOutput.isWellFormed).to.be.a('boolean');
      expect(docOutput).to.have.property('isValidAgainstDTD');
      expect(docOutput.isValidAgainstDTD).to.be.false;
      expect(docOutput).to.have.property('error');
      done();
    });
  })
});

// describe('getXmlDom', function () {
//   it('should get xml DOM from a wellformed xml file', function () {
//     return sisypheXml.getXmlDom(doc.path).then((xmlDom) => {
//       expect(xmlDom).to.be.an('object');
//     })
//   });
//
//   it('should catch an error from a not wellformed xml file', function () {
//     return sisypheXml.getXmlDom(docWithNotWellFormedXml.path).catch((error) => {
//       expect(error).to.be.an.instanceof(Error);
//       expect(error).to.have.property('type');
//       expect(error.type).to.equal('wellFormed');
//       expect(error).to.have.property('list');
//       expect(error.list).to.be.an('Object');
//     })
//   })
// });
//
// describe('getDoctype', function () {
//   it('should get a doctype from a xml file with a good structured doctype', function () {
//     return sisypheXml.getDoctype(doc.path).then((doctype) => {
//       expect(doctype).to.be.an('object');
//       expect(doctype).to.have.property('type');
//       expect(doctype).to.have.property('name');
//       expect(doctype).to.have.property('pubid');
//       expect(doctype).to.have.property('sysid');
//     })
//   });
//
//   it('should get a doctype from a xml file with a bad structured doctype', function () {
//     return sisypheXml.getDoctype(docWithBadDoctypeInXml.path).catch((error) => {
//       expect(error).to.be.an.instanceof(Error);
//       expect(error).to.have.property('type');
//       expect(error.type).to.equal('doctype');
//     })
//   })
// });
//
// describe('getMetadataInfos', function () {
//   it('should get metadata informations with a config file', function () {
//     const confObjInput = {
//       "metadata": [
//         {
//           "name": "someInfos",
//           "regex": "^([a-z]{8})$",
//           "type": "String",
//           "xpath": "/xpath/to/my/infos"
//         }, {
//           "name": "substring",
//           "regex": "\bwelcome\b/i",
//           "type": "String",
//           "xpath": "string(/xpath/to/my/main)"
//         }, {
//           "name": "someInfosWithAutoClosedElement",
//           "type": "String",
//           "xpath": "/xpath/to/my/title"
//         }, {
//           "name": "someInfosWithArray",
//           "regex": "^([a-z]{8})$",
//           "type": "String",
//           "xpath": ["/XPATH/TO/MY/INFOS", "/xpath/to/my/infos"]
//         }, {
//           "name": "noInfos",
//           "regex": "^([a-z]{8})$",
//           "type": "String",
//           "xpath": "/xpath/to/no/infos"
//         }, {
//           "name": "noInfosWithArray",
//           "regex": "^([a-z]{8})$",
//           "type": "String",
//           "xpath": ["/XPATH/TO/NO/INFOS", "/xpath/to/no/infos"]
//         }, {
//           "name": "myNumber",
//           "regex": "^([1-9]{4})$",
//           "type": "Number",
//           "xpath": "/xpath/to/my/number"
//         },
//         {
//           "name": "hasInfos",
//           "type": "Boolean",
//           "xpath": "/xpath/to/my/infos"
//         }, {
//           "name": "hasNoInfos",
//           "type": "Boolean",
//           "xpath": "/xpath/to/no/infos"
//         },{
//           "name": "hasInfosWithArray",
//           "type": "Boolean",
//           "xpath": ["XPATH/TO/MY/INFOS", "/xpath/to/my/infos"]
//         }, {
//           "name": "hasNoInfosWithArray",
//           "type": "Boolean",
//           "xpath": ["XPATH/TO/NO/INFOS", "/xpath/to/no/infos"]
//         }, {
//           "name": "nbParagraph",
//           "type": "Count",
//           "xpath": "/xpath/to/my/p"
//         }, {
//           "name": "nbNoParagraph",
//           "type": "Count",
//           "xpath": "/xpath/to/no/p"
//         }, {
//           "name": "nbParagraphWithArray",
//           "type": "Count",
//           "xpath": ["/XPATH/TO/MY/P", "/xpath/to/my/p"]
//         }, {
//           "name": "nbNoParagraphWithArray",
//           "type": "Count",
//           "xpath": ["/XPATH/TO/NO/P", "/xpath/to/no/p"]
//         }, {
//           "name": "infoWithDefaultXmlNamespace",
//           "type": "Attribute",
//           "xpath": "/xpath/@xml:lang"
//         }
//       ]
//     };
//     const xmlData = `
//     <?xml version="1.0" encoding="UTF-8"?>
//     <xpath xml:lang="FR">
//     <to>
//         <my>
//             <infos>trezaqwx</infos>
//             <main><italic>N° </italic>trezaqwx <bold>end</bold></main>
//             <number>1234</number>
//             <title/>
//             <p>lorem ipsum dolor sit amet</p>
//             <p>lorem ipsum dolor sit amet</p>
//         </my>
//     </to>
//     </xpath>
//     `;
//     const parser = new DOMParser();
//     const xmlDoc = parser.parseFromString(xmlData);
//     return sisypheXml.getMetadataInfos(confObjInput, xmlDoc).map((metadata) => {
//       expect(metadata).to.have.property('name');
//       expect(metadata).to.have.property('type');
//       if (metadata.hasOwnProperty('regex')) {
//         expect(metadata.regex).to.be.a('string');
//       }
//       if (metadata.hasOwnProperty('value') && metadata.value && metadata.type === 'String') {
//         expect(metadata.value).to.be.a('string');
//       }
//       if (metadata.type === 'Count') {
//         expect(metadata.value).to.be.a('number');
//       }
//       if (metadata.type === 'Boolean') {
//         expect(metadata.value).to.be.a('boolean');
//       }
//       if (metadata.hasOwnProperty('value') && metadata.type === 'Attribute') {
//         expect(metadata.value).to.be.a('string');
//       }
//     })
//   })
// });
//
// describe('validateAgainstDTD', function () {
//   it('should validate the Xml file from a docObject and a dtd list who contains a good DTD', function () {
//     doc.doctype = {
//       type: 'PUBLIC',
//       name: 'article',
//       pubid: 'my doctype of doom',
//       sysid: 'mydoctype.dtd'
//     };
//     const arrayPathDTD = [
//       path.resolve(__dirname, '../test/dtd/myBADdoctype.dtd'),
//       path.resolve(__dirname, '../test/dtd/mydoctype.dtd')
//     ];
//     return sisypheXml.validateAgainstDTD(doc, arrayPathDTD).then((result) => {
//       expect(result).to.be.an('object');
//       expect(result).to.have.property('dtd');
//       expect(result).to.have.property('stdout');
//     })
//   });
//
//   it('should catch an error when tries to validate a xml file from a docObject and a dtd list who contains only a bad DTD', function () {
//     const arrayPathDTD = ['test/dtd/myBADdoctype.dtd'];
//     doc.doctype = {
//       type: 'PUBLIC',
//       name: 'article',
//       pubid: 'my doctype of doom',
//       sysid: 'mydoctype.dtd'
//     };
//     return sisypheXml.validateAgainstDTD(doc, arrayPathDTD).catch((error) => {
//       expect(error).to.be.an.instanceof(Error);
//     })
//   })
// });