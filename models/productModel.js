const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
let status = require('../enums/status');
const stockStatus = require("../enums/stockStatus");
var productModel = new Schema({
        vendorId: {
                type: Schema.Types.ObjectId,
                ref: "user"
        },
        categoryId: {
                type: Schema.Types.ObjectId,
                ref: "Category"
        },
        subcategoryId: {
                type: Schema.Types.ObjectId,
                ref: "subcategory",
        },
        gender: {
                type: String,
                enum: ["men", "women", "kid"],
        },
        productId: {
                type: String
        },
        originalPrice: {
                type: Number,
                default: 0
        },
        discountPrice: {
                type: Number,
                default: 0
        },
        discount: {
                type: Number,
                default: 0
        },
        discountActive: {
                type: Boolean,
                default: false
        },
        varient: {
                type: Boolean,
                default: false
        },
        size: {
                type: Boolean,
                default: false
        },
        productName: {
                type: String
        },
        productImage: {
                type: Array
        },
        description: {
                type: String,
        },
        returnPolicy: {
                type: String,
        },
        reviews: [{
                user: {
                        type: Schema.Types.ObjectId,
                        ref: "user",
                },
                name: {
                        type: String,
                },
                rating: {
                        type: Number,
                },
                comment: {
                        type: String,
                },
        }],
        minimunOrderUnit: {
                type: Number,
                default: 0
        },
        avgRatingsProduct: {
                type: Number,
                default: 0
        },
        totalRating: {
                type: Number,
                default: 0
        },
        stock: {
                type: Number
        },
        SKU: {
                type: String
        },
        stockStatus: { type: String, default: stockStatus.ADEQUATE },
        viewOnwebsite: { type: String, default: status.ACTIVE },
}, { timestamps: true });
productModel.plugin(mongoosePaginate);
productModel.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("product", productModel);

