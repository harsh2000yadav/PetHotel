const { db, admin } = require('../util/admin');
const firebase = require('firebase');
const config = require('../util/config')
const {
    validateSignupData,
    validateLoginData,

} = require('../util/validator');

firebase.initializeApp(config);

exports.hostSignUp = (req , res)=>{
    const newUser = {
        name : req.body.name,
        email :req.body.email,
        body: req.body.body,
        password : req.body.password,
        confirmPassword : req.body.confirmPassword,
        handle : req.body.handle,
        address : req.body.address,
        phone:req.body.phone,  
        createdAt : req.body.createdAt,
    };

    const {
        valid,
        errors
    } = validateSignupData(newUser);

    if(!valid) return res.status(400).json(errors);
  let noImg = 'no-img.png' 

    let token,userId;
    db.doc(`/hosts/${newUser.handle}`).get()
        .then(doc =>{
            if(doc.exists){
                return res.status(400).json({
                    handle: 'this handle is already taken'
                });
            } else {
                    return firebase
                        .auth()
                        .createUserWithEmailAndPassword(newUser.email, newUser.password)
                }
        })
        .then((data)=>{
            hostId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((idtoken)=>{
             token = idtoken;
            const userData = {
                name: newUser.name,
                phone: newUser.phone,
                body : newUser.body,
                handle: newUser.handle,
                email: newUser.email,
                phone:newUser.phone,
                createdAt: new Date().toISOString(),
                imageUrl : `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
                hostId

            };
            return db.doc(`/hosts/${newUser.handle}`).set(userData);
        })
        .then((data) => {
            return res.status(201).json({
                token
            })
        })
        .catch((err)=>{
            console.error(err);
            return res.status(500).json({
                error : err.code
            });
        })
}
exports.hostLogin = (req,res) => {
    const user = {
        email : req.body.email,
        password : req.body.password
    }

    const {
        valid,
        errors
    } = validateLoginData(user);

    if(!valid) return res.status(400).json(errors);


    firebase.auth()
        .signInWithEmailAndPassword(user.email,user.password)
        .then((data) => {
            return data.user.getIdToken();
        })
        .then((token)=>{
            return res.json({token})
        })
        .catch((err)=>{
            console.error(err);
            if(err.code === "auth/wrong-password"){
                return res.status(403).json({
                    general: "Wrong credentials , Please try again"
                })
            }else{
                return res.json(500).json({
                    error : "Something Went Wrong , Please try Again"
                })
            }
        })
}


exports.uploadHostImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    let imageFileName;
    let imageToBeUploaded = {};

    const busBoy = new BusBoy({
        headers: req.headers
    })
    busBoy.on('file', (fieldname, file, filename, encoding, mimetype) => {

        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({
                error: 'Wrong File Type'
            })

        }
        console.log(fieldname);
        console.log(filename);
        console.log(mimetype);
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${Math.round(Math.random()*10000000)}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = {
            filepath,
            mimetype
        };

        file.pipe(fs.createWriteStream(filepath));
    });
    busBoy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageToBeUploaded.mimetype
                    }
                }
            })

            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
                return db.doc(`/hosts/${req.user.handle}`).update({
                    imageUrl
                });

            })
            .then(() => {
                return res.json({
                    message: "Image Uploaded"
                })
            })
            .catch((err) => {
                console.error(err);
                return res.status(500).json({
                    error: err.code
                });
            })
    })
    busBoy.end(req.rawBody);

}