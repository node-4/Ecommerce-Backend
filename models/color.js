const mongoose = require("mongoose");
const schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate");
let status = require('../enums/status');
var colorModel = new schema({
        vendorId: {
                type: schema.Types.ObjectId,
                ref: "user"
        },
        color: {
                type: String
        },
        colorCode: {
                type: String
        },
        status: { type: String, default: status.ACTIVE },
}, {
        timestamps: true
}
);
colorModel.plugin(mongoosePaginate);
module.exports = mongoose.model("color", colorModel);