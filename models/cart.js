const mongoose = require('mongoose');
const schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');
let status = require('../enums/status');
const DocumentSchema = schema({
        userId: {
                type: schema.Types.ObjectId,
                ref: "user"
        },
        products: [{
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
        }],
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
        paymentOption: {
                type: String,
                enum: ["PrePaid", "PostPaid"],
                default: "PrePaid"
        },
        totalAmount: {
                type: Number,
                defalut: 0
        },
        totalItem: {
                type: Number
        },
        status: { type: String, default: status.ACTIVE },
}, { timestamps: true })
DocumentSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("cart", DocumentSchema);