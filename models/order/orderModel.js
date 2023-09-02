const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
const schema = mongoose.Schema;
const DocumentSchema = schema({
        orderId: {
                type: String,
        },
        userId: {
                type: schema.Types.ObjectId,
                ref: "user"
        },
        vendorId: {
                type: schema.Types.ObjectId,
                ref: "user"
        },
        categoryId: {
                type: schema.Types.ObjectId,
                ref: "Category"
        },
        subcategoryId: {
                type: schema.Types.ObjectId,
                ref: "subcategory",
        },
        productId: {
                type: schema.Types.ObjectId,
                ref: "product"
        },
        productVarientId: {
                type: schema.Types.ObjectId,
                ref: "productVarient"
        },
        unitId: {
                type: schema.Types.ObjectId,
                ref: "quantityUnit"
        },
        unitInwords: {
                type: String
        },
        productPrice: {
                type: Number
        },
        quantity: {
                type: Number
        },
        total: {
                type: Number
        },
        email: {
                type: String,
        },
        firstName: {
                type: String,
        },
        lastName: {
                type: String,
        },
        phone: {
                type: String,
        },
        address: {
                type: String,
        },
        pincode: {
                type: Number,
        },
        city: {
                type: String,
        },
        state: {
                type: String,
        },
        country: {
                type: String,
        },
        extimatedDelivery: {
                type: String,
        },
        returnStatus: {
                type: String,
                enum: ["return", "cancel"],
                default: ""
        },
        returnPickStatus: {
                type: String,
                enum: ["Pending", "Accept", "Reject", "Pick"],
        },
        returnOrder: {
                type: schema.Types.ObjectId,
                ref: "cancelReturnOrder",
        },
        paymentOption: {
                type: String,
                enum: ["PrePaid", "PostPaid"],
                default: "PrePaid"
        },
        orderStatus: {
                type: String,
                enum: ["unconfirmed", "confirmed", "Processing", "QualityCheck", "Dispatch", "Delivered"],
                default: "unconfirmed",
        },
        paymentStatus: {
                type: String,
                enum: ["pending", "paid", "failed"],
                default: "pending"
        },
}, { timestamps: true });
DocumentSchema.plugin(mongoosePaginate);
DocumentSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model("order", DocumentSchema);