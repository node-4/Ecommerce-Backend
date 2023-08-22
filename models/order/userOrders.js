const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
const schema = mongoose.Schema;
const DocumentSchema = schema({
  userId: {
    type: schema.Types.ObjectId,
    ref: "user"
  },
  orderId: {
    type: String
  },
  Orders: [{
    type: schema.Types.ObjectId,
    ref: "order",
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
  tax: {
    type: String,
  },
  totalAmount: {
    type: String,
  },
  delivery: {
    type: String
  },
  paidAmount: {
    type: String,
  },
  totalItem: {
    type: Number
  },
  extimatedDelivery: {
    type: String,
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
}, { timestamps: true })
DocumentSchema.plugin(mongoosePaginate);
DocumentSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model("userOrder", DocumentSchema);