const cp = require('child_process');
var express = require('express');
var serveStatic = require('serve-static');
const path = require('path');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
var bodyParser = require('body-parser');
const GitManager = require('gitmanagerjs');
const klaw = require("klaw");
let gitManager;
try {
  gitManager = new GitManager();
} catch (error) {}
let sisyphe = null;
var app = express();
app.use(serveStatic(path.join(__dirname, 'out')));
app.use(bodyParser.json());

app.get('/workers', function (req, res) {
  const workers = require('./src/worker.json');
  res.json(workers);
});

app.get('/sisypheVersions', function (req, res) {
  const listWorkers = require('./src/worker.json').workers;
  const modulesVersion = listWorkers.map(name => {
    return {
      name,
      version: require('./src/worker/' + name + '/package.json').version
    };
  });
  res.status(200).json({
    version: require('./package').version,
    modules: modulesVersion
  });
});
app.get('/branches', function (req, res) {
  Promise.join(
    gitManager.local.branches(),
    gitManager.remote.branches(),
    gitManager.local.branch(),
    (localBranchesName, remoteBranchesName, currentBranchName) => {
      res.status(200).json({
        localBranchesName,
        remoteBranchesName,
        currentBranchName
      });
    }
  ).catch(err => {
    res.status(500).json(err);
  });
});

app.post('/changeBranch', function (req, res) {
  gitManager.local
    .checkout(req.body.branch.trim())
    .then(result => {
      res.status(200).json(result);
    })
    .catch(err => {
      res.status(500).json(err);
    });
});
app.post('/pull', function (req, res) {
  gitManager.remote
    .pull(req.body.branch)
    .then(result => {
      res.status(200).json(result);
    })
    .catch(err => {
      res.status(500).json(err);
    });
});
app.get('/status', function (req, res) {
  gitManager.remote
    .status()
    .then(update => res.status(200).json(update))
    .catch(err => res.status(500).json({ err }));
});

app.get('/download/latest', async function (req, res) {
  const items = []
  const sessions = await fs.readdirAsync(path.resolve(__dirname, 'out'))
  const pathToLastSession = path.resolve(__dirname, "out", sessions.sort().pop());
  klaw(pathToLastSession)
    .on("data", item => { 
      if(item && fs.statSync(item.path).isFile()){
        items.push({ path: item.path.split("out").pop() })
      }
    })
    .on("end", _ => {
      res.status(200).json(items);
    });
});
app.get("/ping", function(req, res) {
  res.send("pong");
});
app.get("/alreadyLaunch", function(req, res) {
  const status = (!sisyphe) ? false : true
  return res.status(200).json({ err });
});
app.post('/stop', function (req, res) {
  if (sisyphe) {
    sisyphe.kill('SIGTERM');
    sisyphe = null;
  }
  res.send('stop');
});
app.post('/launch', async function (req, res) {
  if (!sisyphe) {
    console.log('launch');
    const command = req.body.command;
    let commandArray = [];
    console.log(command.workers);
    if (command.name) commandArray.push('-n', command.name);
    if (command.config) commandArray.push('-c', command.config);
    if (command.workers) commandArray.push('-s', command.workers);
    if (command.bundle) commandArray.push('-b', command.bundle);
    if (command.path) commandArray.push(command.path);
    if (!command.debug) commandArray.push('-q');
    console.log(`launch: ${commandArray}`);
    res.send(true);
    sisyphe = cp.fork(path.resolve(__dirname, `app`), commandArray);
    // sisyphe.stdout.pipe(process.stdout);
    sisyphe.on('exit', _ => {
      sisyphe = null;
    });
  } else {
    console.log('Already launch');
    res.send(false);
  }
});
app.post('/readdir', async function (req, res) {
  fs
    .readdirAsync(req.body.path)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      return res.send({ error: err.message });
    });
});
console.log('listen to port 3264');
app.listen(3264);