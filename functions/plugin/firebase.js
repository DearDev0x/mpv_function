// The Firebase Admin SDK to access Firestore.
var admin = require("firebase-admin");
admin.initializeApp();

exports.paymentCollection = admin.firestore().collection("payments");