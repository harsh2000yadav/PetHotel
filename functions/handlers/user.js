const { db, admin } = require('../util/admin');
const firebase = require('firebase');


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