const {
    admin,
    db
} = require('./admin');



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
            admin.auth().getUser(req.user.uid)
            .then((data) => {
                return next();
                })
            .catch((err) =>{
                console.error('Error while verifying token', err)
                return res.status(403).json(err);
            })  
         
        })
       
}

