Sisyphe-filetype
=========
A [sisyphe](/../../) module which detect filetype

### What does it do ?
This module will get the path of the file in data & extracts :  mimetype, mimeDetails (a mimetype with more informations) 

![sisyphe-filetype-out](/src/worker/filetype/sisyphe-filetype-out.png)

### How it works ?
It use a library based on file detection via 'magic numbers' algorythm.
It does not really care about extensions.


### Corrupt files
This module is able to detect a lot of broken files (Ok not all ...almost), corrupt files will get a mimetype "application/octet-stream".


### Info 
Hidden files mimetype can be set to "application/octet-stream" whereas they are not actually broken.
