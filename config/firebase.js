const admin = require('firebase-admin');
const config = require('./gg-guides-54890-firebase-adminsdk-fbsvc-d78d28ff22.json');

admin.initializeApp({
    credential: admin.credential.cert(config),
});

const db = admin.firestore();

module.exports = db;