const admin = require('firebase-admin');
var serviceAccount = require("./admin.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pethotel-e7d26.firebaseio.com",
    storageBucket: "pethotel-e7d26.appspot.com"
});

const db = admin.firestore();

module.exports = {
    admin,
    db
};