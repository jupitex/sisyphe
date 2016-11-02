const chai = require('chai'),
  kuler = require('kuler'),
  doTheJob = require('../index.js').doTheJob,
  expect = chai.expect;

const redisHost = process.env.REDIS_HOST || 'localhost',
  redisPort = process.env.REDIS_PORT || '6379';

const FromXml = require('xpath-generator').FromXml,
  redis = require('redis');

describe('Redis', () => {
  it('Should have redis env placed', (done)=> {
    if (!process.env.REDIS_HOST) {
      console.warn(kuler('No REDIS_HOST env defined, so localhost is used', 'orange'));
    }
    if (!process.env.REDIS_PORT) {
      console.warn(kuler('No REDIS_PORT env defined, so localhost is used', 'orange'));
    }
    done();
  });
  it('Should have a redis lauched to worked', (done)=> {
    let client = redis.createClient(`//${redisHost}:${redisPort}`);
    client.on('error', (err) => {
      return done(err)
    });
    client.on('connect', () => {
      done();
    })
  })
});

describe('DoTheJob', () => {
  it('Should not doing work if mimetype is not xml', (done) => {
    let objTest = {
      extension: '.xml',
      path: 'test/test.xxx',
      mimetype: 'application/xxx',
      size: 500
    };
    doTheJob(objTest, (err, data)=> {
      if (err) {
        return done(err);
      }
      expect(data).to.deep.equal(objTest);
      done();
    });
  })
  it('Should generate xpath obj', (done) => {
    let objTest = {
      extension: '.xml',
      path: 'test/test.xml',
      mimetype: 'application/xml',
      size: 500
    };
    doTheJob(objTest, (err, data)=> {
      if (err) {
        return done(err);
      }
      expect(data.xpath).to.exist;
      expect(data.xpath).to.be.an('object');
      expect(data.xpath).to.be.not.empty;
      expect(data.xpath[Object.keys(data.xpath)[0]]).to.have.property('foo')

      return done();
    });
  })
});