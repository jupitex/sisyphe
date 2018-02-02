const cp = require("child_process");
var express = require("express");
var serveStatic = require("serve-static");
const path = require("path");
const Promise = require("bluebird");
const redis = require("redis");
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
let client = redis.createClient();
const redisIsLaunching = false;
client.on("error", err => {
  if (!redisIsLaunching) launchRedis();
});
const spawn = require("child_process").spawn;
const fs = Promise.promisifyAll(require("fs"));
var bodyParser = require("body-parser");
const GitManager = require("gitmanagerjs");
const klaw = require("klaw");
launchRedis();
let gitManager;
try {
  gitManager = new GitManager();
} catch (error) {}
let sisyphe = null;
var app = express();
app.use(serveStatic(path.join(__dirname, "out")));
app.use(bodyParser.json());

app.get("/session/latest", async function(req, res) {
  const redisObj = new Redis()
  const monitoring = await client.hgetallAsync('monitoring')
  result = await redisObj.getJobsFrom(monitoring);
  return res.status(200).json(result || false);
});

function Redis() {}
/**
 * Searches all keys in redis and stores them in the local object
 * @return {bluebird} bluebird resolve with all key in redis
 */
Redis.prototype.getJobsFrom = async function(session) {
  if (!session || !session.hasOwnProperty('workers')) return;
  workers = session.workers.split(",");
  workers = await Promise.map(workers, async worker => {
    const waitingJobs = +await client.llenAsync(`${worker}`);
    return {
      name: worker,
      waitingJobs
    };
  });
  session.workers = workers;
  return session;
};

app.get("/workers", function(req, res) {
  const workers = require("./src/worker.json");
  res.json(workers);
});

app.get("/sisypheVersions", function(req, res) {
  const listWorkers = require("./src/worker.json").workers;
  const modulesVersion = listWorkers.map(name => {
    return {
      name,
      version: require("./src/worker/" + name + "/package.json").version
    };
  });
  res.status(200).json({
    version: require("./package").version,
    modules: modulesVersion
  });
});
app.get("/branches", function(req, res) {
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

app.post("/changeBranch", function(req, res) {
  gitManager.local
    .checkout(req.body.branch.trim())
    .then(result => {
      res.status(200).json(result);
    })
    .catch(err => {
      res.status(500).json(err);
    });
});
app.post("/pull", function(req, res) {
  gitManager.remote
    .pull(req.body.branch)
    .then(result => {
      res.status(200).json(result);
    })
    .catch(err => {
      res.status(500).json(err);
    });
});
app.get("/status", function(req, res) {
  gitManager.remote
    .status()
    .then(update => res.status(200).json(update))
    .catch(err => res.status(500).json({ err }));
});

app.get("/download/latest", async function(req, res) {
  const items = [];
  const sessions = await fs.readdirAsync(path.resolve(__dirname, "out"));
  const pathToLastSession = path.resolve(
    __dirname,
    "out",
    sessions.sort().pop()
  );
  klaw(pathToLastSession)
    .on("data", item => {
      if (item && fs.statSync(item.path).isFile()) {
        items.push({ path: item.path.split("out").pop() });
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
  const status = !sisyphe ? false : true;
  return res.status(200).json(status);
});
app.post("/stop", async function(req, res) {
  if (sisyphe === null) return
  sisyphe.kill('SIGTERM')
  sisyphe = null
  res.send("stop");
});
app.post("/launch", async function(req, res) {
  if (!sisyphe) {
    const command = req.body.command;
    let commandArray = [];
    if (command.name) commandArray.push("-n", command.name);
    if (command.config) commandArray.push("-c", command.config);
    if (command.workers) commandArray.push("-s", command.workers);
    if (command.bundle) commandArray.push("-b", command.bundle);
    if (command.path) commandArray.push(command.path);
    if (!command.debug) commandArray.push("-q");
    res.send(true);
    sisyphe = cp.fork(path.resolve(__dirname, `app`), commandArray);
    sisyphe.on("exit", _ => {
      sisyphe = null;
    });
  } else {
    res.send(false);
  }
});
app.post("/readdir", async function(req, res) {
  fs
    .readdirAsync(req.body.path)
    .then(data => res.send(data))
    .catch(err => res.send({ error: err.message }));
});
console.log("listen to port 3264");
app.listen(3264);

function launchRedis() {
  let pathToRedisServer;
  const os = require("os");
  if (os.platform() === "linux")
    pathToRedisServer = path.resolve(
      __dirname,
      "lib",
      "redis-linux-64",
      "src",
      "redis-server"
    );
  else if (os.platform() === "darwin")
    pathToRedisServer = path.resolve(
      __dirname,
      "lib",
      "redis-darwin-64",
      "src",
      "redis-server"
    );
  else if (os.platform() === "win32")
    pathToRedisServer = path.resolve(
      __dirname,
      "lib",
      "redis-win-64",
      "src",
      "redis-server"
    );
  if (pathToRedisServer) {
    const spawnRedis = cp.spawn(pathToRedisServer);
    this.redisIsLocal = true;
  }
}

process.on("unhandledPromiseRejection", (err, p) => {
  console.log("An unhandledRejection occurred");
  console.log(`Rejected Promise: ${p}`);
  console.log(`Rejection: ${err}`);
});
process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
  // application specific logging, throwing an error, or other logic here
});
