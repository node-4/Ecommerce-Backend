const mongoose = require("mongoose");
const transactionSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "user",
    },
    sender: {
        type: mongoose.Schema.ObjectId,
        ref: "user",
    },
    reciver: {
        type: mongoose.Schema.ObjectId,
        ref: "user",
    },
    orderId: {
        type: mongoose.Schema.ObjectId,
        ref: "order",
    },
    cancelReturnOrderId: {
        type: mongoose.Schema.ObjectId,
        ref: "cancelReturnOrder",
    },
    date: {
        type: Date,
        default: Date.now,
    },
    amount: {
        type: Number,
    },
    paymentMode: {
        type: String,
    },
    type: {
        type: String,
    },
    relatedPayments: {
        type: String,
    },
    Status: {
        type: String,
    },
});
const transaction = mongoose.model("transaction", transactionSchema);
module.exports = transaction;
