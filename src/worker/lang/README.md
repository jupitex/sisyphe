Sisyphe-Lang
=========
A [sisyphe](/../../) module which detect lang of files

### What does it do ?
It can just detect Lang of plain/text & XML/HTML files (maybe PDF in the future)

### How it works ?
It is based on [CLD](https://www.npmjs.com/package/cld) lang detection 


### Output


```
    {
      name: 'sessionName',
      ... : ...,
      langDetect: {
        reliable: true,
        textBytes: 8779,
        languages: [
          { name: 'FRENCH', code: 'fr', percent: 51, score: 636 },
          { name: 'ENGLISH', code: 'en', percent: 48, score: 1299 }
        ]
      }
    }
```javascript