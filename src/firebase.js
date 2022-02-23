//FIREBASE------------------------------------------------
var admin = require("firebase-admin");

var serviceAccount = require("../hogarya-5589e-firebase-adminsdk-zxzx4-d3daf11d91.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://hogarya-5589e.firebaseio.com"
});
//FIREBASE------------------------------------------------
module.exports =admin;