const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
const status = require('../enums/status');
const stockStatus = require("../enums/stockStatus");
var productModel = new Schema({
        vendorId: {
                type: Schema.Types.ObjectId,
                ref: "user"
        },
        productId: {
                type: Schema.Types.ObjectId,
                ref: "product"
        },
        unitId: {
                type: Schema.Types.ObjectId,
                ref: "quantityUnit"
        },
        unitInwords: {
                type: String
        },
        color: {
                type: Schema.Types.ObjectId,
                ref: "color"
        },
        size: {
                type: Boolean,
                default: false
        },
        productImage: {
                type: String
        },
        productImages: [{
                image: {
                        type: String
                },
        }],
        colorsUnits: [{
                unitId: {
                        type: Schema.Types.ObjectId,
                        ref: "quantityUnit"
                },
                unitInwords: {
                        type: String
                },
                stock: {
                        type: Number
                },
                stockStatus: {
                        type: String,
                        default: stockStatus.ADEQUATE
                },
        }],
        stock: {
                type: Number
        },
        avgRatingsProduct: {
                type: Number,
        },
        stockStatus: { type: String, default: stockStatus.ADEQUATE },
        status: { type: String, default: status.ACTIVE },
},
        { timestamps: true }
);
productModel.plugin(mongoosePaginate);
productModel.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("productVarient", productModel);

