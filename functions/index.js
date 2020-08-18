const functions = require('firebase-functions');
const express = require('express');
const app = express();
const config = require('./util/config')
const firebase = require('firebase');
var cors = require('cors');
app.use(cors());
// firebase.initializeApp(config);
const {
    db,
    admin,
} = require('./util/admin')
const  hostAuth = require('./util/hostAuth')
const  userAuth = require('./util/userAuth')
const  commonAuth = require('./util/commonAuth')
const {
    signUp,
    login,
} = require('./handlers/user');

const {
    hostSignUp,
    hostLogin,
    uploadHostImage,
    getAuthenticatedUser
} = require('./handlers/host');

const {
    hostData
} = require('./handlers/getData')

//host
app.post('/host/signUp',hostSignUp);
app.post('/host/login',hostLogin);
app.get('/host',hostAuth,getAuthenticatedUser);
app.get('/hosts',hostData);
app.post('/host/image',hostAuth,uploadHostImage);
//user
app.post('/user/signUp',signUp);
app.post('/user/login',login);


exports.api = functions.https.onRequest(app);