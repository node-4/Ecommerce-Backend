const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
const schema = mongoose.Schema;
const categorySchema = new mongoose.Schema({
    vendorId: {
        type: schema.Types.ObjectId,
        ref: "user"
    },
    name: {
        type: String
    },
    gender: {
        type: String,
        enum: ["men", "women", "kid"],
    },
    status: {
        type: String,
        enum: ["Active", "Block"],
        default: "Active"
    },
    approvalStatus: {
        type: String,
        enum: ["Pending", "Accept", "Reject"],
    },
}, { timestamps: true }
);
categorySchema.plugin(mongoosePaginate);
categorySchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model("Category", categorySchema);
