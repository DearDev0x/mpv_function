const axios = require('axios');
const crypto = require('crypto');
const functions = require('firebase-functions');
const {
    paymentCollection
} = require("../plugin/firebase.js");

exports.success = async (req, res) => {
    functions.logger.info("user success payment!", req.body);
    try {
        const data = req.body;
        let doc = await paymentCollection.where("TransactionId", "==", String(data.TransactionId)).limit(1).get();
        if (doc.empty) {
            throw "cannot find order";
        } else {
            let id = [];
            doc.forEach((el) => {
                id.push(el.id);
            });
            functions.logger.info("user payment payment order id!", id[0]);
            var orderRef = paymentCollection.doc(id[0]);
            let update;
            if (String(data.PaymentStatus) === "0") {
                update = {
                    PaymentStatus: data.PaymentStatus,
                    PaymentDate: data.PaymentDate
                }
            } else {
                update = {
                    PaymentStatus: data.PaymentStatus
                }
            }
            await orderRef.update(update);
        }
    } catch (err) {
        functions.logger.info("user payment catch!", err);
    }
}

exports.create = async (req, res) => {
    try {
        let form = {
            MerchantCode: "M031732",
            OrderNo: null,
            CustomerId: null,
            Amount: null,
            PhoneNumber: null,
            Description: null,
            ChannelCode: null,
            Currency: 764,
            LangCode: "TH",
            RouteNo: "1",
            IPAddress: "192.168.1.7:8080",
            ApiKey: "AqdoHRkWVIAi27yrsUu8WANXtWIM026PL0Mz8F9Vg7NCLEp1RsxRSv4yhV4RZgSO",
            ProductImageUrl: null,
        };
        let data = req.body.form;
        for (let i in data) {
            form[i] = data[i];
        }
        if (form.ChannelCode == "bank_qrcode") {
            delete form.PhoneNumber;
        }
        form.OrderNo = await getOrderNo();
        let sum = checkSumEncryp(form);
        form = Object.assign(form, {
            CheckSum: sum
        });
        let response = await axios.post('https://sandbox-appsrv2.chillpay.co/api/v2/Payment/', form);
        if (response.data.Code === 200) {
            await savePayment(req.body, response.data);
            functions.logger.info("user create payment!", response.data);
            await res.json({
                message: "success",
                status: 200,
                data: response.data
            });
        } else {
            throw 'Payment failed'
        }
    } catch (err) {
        functions.logger.info("user create payment error!", err);
        res.json({
            status: 400,
            error: err
        })
    }
}

function checkSumEncryp(form) {
    let md5key =
        "Z5zZf38usZKeeVFjwvbwshr7Aq7t18QWeZI9vLMzYcK2FG5vOMI47o36O7ppBxIXKbUyWjjG8q9y3a8QtpM1GRWQnGBwaxPob0cGMhxAQgU1Q5inMp8cRujQKbiFDnejKMFf2qb44ywzABH5ESUAhWBSgT1JJiXZdzT5k";
    let key = Object.keys(form);
    let txt = "";
    key.forEach((element) => {
        if (element != "CheckSum") {
            txt += form[element];
        }
    });
    txt += md5key;

    let cryp = crypto.createHash('md5').update(txt).digest("hex");

    return cryp;
};

async function savePayment(req, paymentData) {
    await paymentCollection.add({
        Amount: paymentData.Amount,
        OrderNo: Number.parseInt(paymentData.OrderNo),
        CustomerId: paymentData.CustomerId,
        Token: paymentData.Token,
        Description: req.form.Description,
        TransactionId: String(paymentData.TransactionId),
        ChannelCode: paymentData.ChannelCode,
        CreatedDate: paymentData.CreatedDate,
        ExpiredDate: paymentData.ExpiredDate,
        tokenAddress: req.tokenAddress,
        tokenAmount: req.tokenAmount,
        ethereumAddress: req.ethereumAddress
    });
}

async function getOrderNo() {
    try {
        let doc = await paymentCollection.orderBy("OrderNo", "desc").limit(1).get();
        if (doc.empty) {
            return 1
        } else {
            let data = [];
            doc.forEach((el) => {
                data.push(el.data());
            });
            let orderNo = Number.parseInt(data[0].OrderNo) + 1;
            return orderNo;
        }
    } catch (err) {
        throw err;
    }
}