sisyphe-pdf
=======
Sisyphe module of generating PDF's informations

### What does it do ?
Sisyphe PDF will add some kind of informations about PDF files  (Pdf verison, author, Software used to build it & date ...)
If a file is not a PDF it will just "next" it.

![sisyphe-pdf-out](/src/worker/pdf/sisyphe-pdf-out.png)


### How it works ?
Sisyphe PDF use a c++ binding Poppler on Linux & OSX 
It use Mozilla "PDFJS" on windows to obtains PDF informations.

### Test
Just exec `npm test`
