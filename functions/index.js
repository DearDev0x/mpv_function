const express = require('express');
const app = express();
const cors = require('cors')
const port = process.env.PORT || 7777;
let apiRoutes = require("./router");
const functions = require('firebase-functions');

app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());

app.use(cors())

app.post('/payment', (req, res) => {
    functions.logger.info("user redirect to page!");
    res.redirect('https://wallet.mepoint.one');
});

app.use('/api/payment', apiRoutes.payment);

exports.mpv = functions.region("asia-southeast1").https.onRequest(app);
