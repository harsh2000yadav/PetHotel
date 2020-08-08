const {
    db
} = require('../util/admin')


exports.hostData = (req, res) => {
    db.collection('hosts').get()
        .then(data => {
            let hosts = [];
            data.forEach(doc => {
               hosts.push({
                    body: doc.data().body,
                    hostId: doc.data().id,
                    email : doc.data().email,
                    phone : doc.data().phone,
                    name : doc.data().name,
                    userHandle: doc.data().userHandle,
                    createdAt: doc.data().createdAt,
                    imageUrl:doc.data().imageUrl,
                    price : doc.data().price
                })
            })
            return res.json(hosts);
        })
        .catch(err => console.log(error))
}
