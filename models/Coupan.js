const mongoose = require("mongoose");
const schema = mongoose.Schema;
const couponSchema = new mongoose.Schema({
        users: [{
                type: schema.Types.ObjectId,
                ref: "user"
        }],
        couponCode: {
                type: String,
        },
        description: {
                type: String,
        },
        discount: {
                type: Number,
        },
        couponType: {
                type: String,
        },
        expirationDate: {
                type: Date,
        },
        activationDate: {
                type: Date,
        },
        status: {
                type: Boolean,
                default: false,
        },
}, { timestamps: true });
module.exports = mongoose.model("coupons", couponSchema);
