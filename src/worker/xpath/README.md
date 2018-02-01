Sisyphe-xpath
============
Module of generating of xpaths (with their attributes) for XML files.

## How it works ?
This module use [xpath-generator](https://github.com/Inist-CNRS/xpath-generator) on each data transfered store & count them in redis.
After all sisyphe-jobs terminated, it will epxort a txt file in `/yourcustomfolder/sisyphe/job/$timestamp/xpath-list.txt` which is a list of all xpath's follow by the time they occured in the xml-corpus

![sisyphe-xpath](/src/worker/xpath/sisyphe-xpath-output.png)

## Info
Xpath list are random sorted (due to redis export ...), you can order them in an .csv file but this will not represent the element as the appear in xml's files.




