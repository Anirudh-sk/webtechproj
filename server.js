const express = require("express")
const multer = require("multer")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const File = require("./models/File")
require("dotenv").config()
const app = express()
app.use(express.urlencoded({extended: true}))


const PORT= process.env.PORT || 3000
const upload= multer({dest: "uploads"})
mongoose.connect(process.env.Database_URL)

app.set("view engine", 'ejs')

app.get("/", (req,res)=>{
    res.render("index")
})

app.post("/upload", upload.single("file") , async(req,res)=>{
    const filedata={
        path: req.file.path,
        originalName: req.file.originalname,
        password: await bcrypt.hash(req.body.password, 10)
    }

    const file = await File.create(filedata)
    res.render("index", {fileLink: `${req.headers.origin}/file/${file.id}`})
      
})

app.get("/file/:id", handleDownload)
app.post("/file/:id", handleDownload)

async function handleDownload(req,res){
    const file = await File.findById(req.params.id)

    if(file.password){
        if(req.body.password == null){
            res.render("password")
            return
        }
        if(! (await bcrypt.compare(req.body.password, file.password))){
            res.render("password", {error: true})
            return
        }
    }
    file.downloadCount++
    await file.save()
    console.log(file.downloadCount);

    res.download(file.path, file.originalName)
    
}

app.listen(PORT)