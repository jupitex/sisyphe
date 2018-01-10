Sisyphe-xml
=====
Module which generate XML's information for Sisyphe

## Structure Directory
All you have to do is to add your dtd & your "sisyphe-conf.json" config file into your configFolders,
configFolders can be any folder on your computer (it's -c argument when you start sisyphe).
Sisyphe-xml will try to match the best config dir to use .
If no any configFolder are given sisyphe-xml will try to get config file in worker/xml/conf

eg: 

```
.
├── a                        
└── sample                           
    └── path                   
    │   └── test
            └── DTD
            └── sisyphe-confg.json
    │   └── some
            └── DTD
            └── sisyphe-conf.json
    │   └── any
    │   └── others
```

The command : `node app.js -n test2 -c /a/sample/path` will find that "test" is the best option to use.


## How it works ?
This module use XmlStarlet NodeJs wrapper to check xmldata, it add in data :
- XML formation (Wellformed or not)
- XML validation (is the XML file valid against its own listed DTD & Other DTD you may want to check against) 
- Retrives XML informations in any XML element you want


## Welformed
Sisyphe xml will firstly check if XML is wellformed or not. A property " isWellFormed" will be set


## DTD & XSD schema Validation

If XML is wellformed, Sisyphe-xml is able to check XML against DTD, you just have to create a directory in `xml/conf/folderName`
where "folderNamme" is the folderName you entered in sisyphe command.

In the nearly created folder you have to create a "sisyphe-conf.json" config file & put your dtd files ina dtd folder.

In the config file you just have to put your relative mains entries dtd's path:

eg

```javascript
{
  xml: {
    dtd: ['folder/file1.dtd', 'folder/file2.dtd'],
    schema: ['folder/file1.xsd', 'folder/file2.xsd']

  }
}
```

Sisyphe will check dtd against file1 then file2 ...


#### Info
If the .XML is VALID against its own listed a "validateAgainstDTD" & "validateAgainstSchemas" field will be set to true
If .XML is not valid properties "validationSchemaErrors" & "validationDTDErrors" will be set


## XML Extraction

If a document is wellformed & DTD Valid we can extract some kind of informations in it

There are 2 options you can use:
- dtd (an array of DTD Path you wan to validate against file)
- metadata (which represent XML element informations you want to extract)
  - Check element presence
  - Text extraction
  - Count elements

#### Config of extracted metadata

You will have to create your own sisyphe-xml.json config files, you will have to writte an array of objects containing xpath name, path & type.

eg

```javascript
xml: {
  {
    medatada: [{name, type xpath},{name, type xpath, regex},{...}]
  }
}
```

NAME: An Id, must be present only one time [required]
TYPE: String, Number, Boolean, Count, Attribute [required]
XPATH: the path of the value you want to get [required]
Regex: A javascript regex to check if the value returned is in a correct form. [optional]

In the end you should have something like:

eg

```javascript
xml: {
  {
    medatada: [
    {
      "name": "publicationYear", 
      "type": "Number", 
      "xpath": "///article-meta/pub-date/year", 
      "regex": "^([0-9]{4})$" 
      },
      {...}]

  }
}
```

You can find a complete exemple [here](/worker/sisyphe-xml/conf/exemple)