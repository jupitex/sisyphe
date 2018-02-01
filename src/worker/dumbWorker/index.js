const dumbWorker = {};

dumbWorker.init = function (options = {id: 123456, throw:false}) {
  this.id = options.id;
  this.throw = options.throw
  this.time = ~~(Math.random() * 100);
  return this;
};

dumbWorker.doTheJob = function (data, done) {
  setTimeout(() => {
    try {
      if (this.throw) throw new Error();

      data.id = this.id;
      done(null, data);
    } catch (error) {
      done(error)
    }
  }, data.time || this.time);
};

dumbWorker.finalJob = function (done) {
  setTimeout(_=>{
    try {
      if (this.throw) throw new Error()
      this.id = 999
      done()
    } catch (error) {
      done(error)
    }
  }, this.time);
};

module.exports = dumbWorker;
