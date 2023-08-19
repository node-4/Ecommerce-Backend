const mongoose = require("mongoose");
const schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate");
let status = require('../enums/status');
var unitModel = new schema({
    vendorId: {
        type: schema.Types.ObjectId,
        ref: "user"
    },
    unit: {
        type: String
    },
    status: { type: String, default: status.ACTIVE },
}, {
    timestamps: true
}
);
unitModel.plugin(mongoosePaginate);
module.exports = mongoose.model("quantityUnit", unitModel);
