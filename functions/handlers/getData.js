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
                    userImage:doc.data().userImage
                })
            })
            return res.json(hosts);
        })
        .catch(err => console.log(error))
}
