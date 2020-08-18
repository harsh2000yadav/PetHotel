const {
    admin,
    db
} = require('./admin')

module.exports = (req,res,next) => {
    let idtoken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        idtoken = req.headers.authorization.split('Bearer ')[1];
    }else{
        console.log("No Token")
        return res.status(403).json({
            error : "Unauthorized"
        })
    }

    admin.auth().verifyIdToken(idtoken)
        .then(decodedToken => {
            req.user = decodedToken;
            console.log(decodedToken)
            return db.collection('hosts')
                .where('hostId', '==' , req.user.uid)
                .limit(1)
                .get()
        })
        .then(data=>{
            req.user.handle = data.docs[0].data().handle
            req.user.imageUrl = data.docs[0].data().imageUrl;
            return next();
        })
        .catch((err)=>{
            console.error('Error while verifying token', err)
            return res.status(403).json(err);
        })
}

