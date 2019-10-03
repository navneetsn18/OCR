const express = require('express');
const app = express();
const fs = require('fs');
const ejs = require('ejs');
const multer = require('multer');
const path = require('path');
const {TesseractWorker}= require("tesseract.js");
worker = new TesseractWorker();

app.use('/public',express.static("public"));
app.use('/css',express.static("css"));
app.use('/js',express.static("js"));

const storage = multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null,"./uploads");
    },
    filename: (req,file,cb)=>{
        cb(null,file.originalname);
    }
});

const upload = multer({storage: storage}).single("image");

app.get('/',function(req,res)
{
    res.sendFile('./public/index.html',{
        root : path.join(__dirname+'/')
    })
});

app.post('/upload',(req,res)=>{
    upload(req,res,err=>{
        fs.readFile(`./uploads/${req.file.originalname}`,(err,data)=>{
            if(err)
               return console.log(err);
            worker
            .recognize(data,"eng",{tessjs_create_pdf:'1'})
            .progress(progress=>{
                console.log(progress);
            })
            .then(result=>{
                res.redirect('/download');
            })
            .finally(()=>worker.terminate());
        });
        console.log("File details: ",req.file);
    })
})

app.get('/download',(req,res)=>{
    const file = `${__dirname}/tesseract.js-ocr-result.pdf`;    
    res.download(file);
    const directory = 'uploads';
    fs.readdir(directory, (err, files) => {
        if (err) throw err;
        for (const file of files) {
            fs.unlink(path.join(directory, file), err => {
            if (err) throw err;
            });
        }
    });
})

const PORT = 3000 ||  process.env.PORT; 
app.listen(PORT,()=> console.log(`Listening on port ${PORT}`));