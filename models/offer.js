const mongoose = require("mongoose");
const schema = mongoose.Schema;
const FeedbackSchema = new mongoose.Schema(
    {
        userId: {
            type: schema.Types.ObjectId,
            ref: "user"
        },
        categoryId: {
            type: schema.Types.ObjectId,
            ref: "Category"
        },
        productId: {
            type: schema.Types.ObjectId,
            ref: "product"
        },
        user: [{
            type: schema.Types.ObjectId,
            ref: "user"
        }],
        couponCode: {
            type: String,
        },
        amount: {
            type: Number,
        },
        expirationDate: {
            type: Date,
        },
        activationDate: {
            type: Date,
        },
        image: {
            type: String,
        },
        type: {
            type: String,
            enum: ["user", "other"]
        },
        status: {
            type: Boolean,
            default: false,
        },
    },
    { timeseries: true }
);
module.exports = mongoose.model("offer", FeedbackSchema);