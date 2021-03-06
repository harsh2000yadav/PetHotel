const { db, admin } = require('../util/admin');
const firebase = require('firebase');
const config = require('../util/config')
// firebase.initializeApp(config);

const {
    validateSignupData,
    validateLoginData,

} = require('../util/validator');



exports.signUp = (req , res)=>{
    const newUser = {
        email :req.body.email,
        password : req.body.password,
        confirmPassword : req.body.confirmPassword,
        handle : req.body.handle,
        address : req.body.address,
        phone:req.body.phone       
    };

    const {
        valid,
        errors
    } = validateSignupData(newUser);

    if(!valid) return res.status(400).json(errors);

    let token,userId;
    db.doc(`/users/${newUser.handle}`).get()
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
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((idtoken)=>{
             token = idtoken;
            const userData = {
                handle: newUser.handle,
                email: newUser.email,
                phone:newUser.phone,
                address : newUser.address,
                createdAt: new Date().toISOString(),
                userId
            };
            return db.doc(`/users/${newUser.handle}`).set(userData);
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
exports.login = (req,res) => {
    const user = {
        email : req.body.email,
        password : req.body.password
    }

    const {
        valid,
        errors
    } = validateLoginData(user);
    if (!valid) return res.status(400).json(errors)



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

exports.uploadImage = (req, res) => {
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
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`
                return db.doc(`/users/${req.user.handle}`).update({
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