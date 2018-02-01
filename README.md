[![Build Status](https://travis-ci.org/jupitex/sisyphe.svg?branch=master)](https://travis-ci.org/jupitex/sisyphe)
[![bitHound Overall Score](https://www.bithound.io/github/jupitex/sisyphe/badges/score.svg)](https://www.bithound.io/github/jupitex/sisyphe)

![sisyphe](./logo-sisyphe.jpg)

## Sisyphe

Sisyphe is a simple NodeJS (recursive) folders analyser application & a ([lerna](https://github.com/lerna/lerna)) git [monorepo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md).

Basically it can provided somes informations, [check here for informations](#modules)

![Sisyphe-pic](./sisyphe.gif)

### Requirements
Tested with NodeJS@8.X, Redis@3.2.6

Works on Linux/OSX/Windows

Example to run a quick local redis (thanks to docker):
```bash
docker run --name sisyphe-redis -p 6379:6379 redis:3.2.6
```

### Install it

1. Download the latest Sisyphe version 
2. Just do : `npm install` (this will execute a npm postinstall)
3. ... that's it.

### Test

`npm run test` will test sisyphe & its workers

### Help

`./app.js --help` Will output help

### Options
    -V, --version               output the version number
    -n, --corpusname <name>     Corpus name (session name)
    -s, --select <name>         Choose modules for the analyse
    -c, --config-dir <path>     Configuration folder path
    -t, --thread <number>       The number of process which sisyphe will take
    -b, --bundle <number>       Regroup jobs in bundle of jobs
    -r, --remove-module <name>  Remove module name from the workflow
    -q, --quiet                 Silence output
    -l, --list                  List all available workers
    -h, --help                  output usage information

### How it works ?

Just start Sisyphe on a folder with any files in it.

`node app -n sessionName ~/Documents/customfolder/corpus`


`node app -n sessionName -c ~/Documents/customfolder/folderResources ~/Documents/customfolder/session`


Sisyphe is now working in background using all your computer threads.
Just take a coffee and wait , it will prevent you when it's done :)

The result of sisyphe is present @ `sisyphe/out/{timestamp}-corpusname/` (errors,info,duration..)



### Interface
For a control panel & full binded app, go to [Sisyphe-monitor](https://github.com/jupitex/sisyphe-monitor)
sisyphe has a server that allows to control it and to obtain more information on its execution.
Simply run the server with `npm run server` to access these features



![Sisyphe-dashboard](./sisyphe-monitor.gif)

### Modules
These are the default modules (focused on xml & pdf).

- [FILETYPE](src/worker/filetype) Will detect mimetype,extension, corrupted files..
- [PDF](src/worker/pdf) Will get info from PDF (version, author, meta...)
- [XML](src/worker/xml) Will check if it's wellformed, valid-dtd's, get elements from balises ...
- [LANG](src/worker/lang) Will  detect lang of files (xml/text files ...)
- [XPATH](src/worker/xpath)  Will generate a complete list of xpaths from submitted folder
- [OUT](src/worker/out) Will export data to json file & ElasticSearch database
- [NB](src/worker/nb) Try to assing some categories to an XML document by using its abstract
- [MULTICAT](src/worker/multicat) Try to assing some categories to an XML document by using its identifiers
- [TEEFT](src/worker/teeft) Try to extract keywords of a fulltext
- [SKEEFT](src/worker/skeeft) Try to extract keywords of a structured fulltext by using teeft algorithm and text structuration


### Developpement on worker

When you work on worker, just:
- Commit your changes as easy
- Do a `npm run updated` (to check what worker has changed)
- Do a `npm run publish` (it will ask you to change version of module worker & publish it to github)


### Modules informations
 
Some bugs could occured with certains files with 'skeeft' on windows module please just disactivate it until we fix.
