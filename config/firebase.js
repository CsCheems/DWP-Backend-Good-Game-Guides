const admin = require('firebase-admin');
const config = require('./gg-guides-54890-firebase-adminsdk-fbsvc-e2bb56b1fa.json');

admin.initializeApp({
    credential: admin.credential.cert(config),
});

const db = admin.firestore();

module.exports = db;