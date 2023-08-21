const mongoose = require('mongoose');
const schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');
let status = require('../enums/status');
let kycStatus = require('../enums/kycStatus');
const DocumentSchema = schema({
        vendorId: {
                type: schema.Types.ObjectId,
                ref: "user"
        },
        aadhar: {
                type: String
        },
        panCard: {
                type: String
        },
        gstNO: {
                type: String
        },
        addressProof: {
                type: String
        },
        kycStatus: {
                type: String,
                default: kycStatus.UPLOADED
        },
        status: {
                type: String,
                default: status.ACTIVE
        },
}, { timestamps: true })
DocumentSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("vendorKyc", DocumentSchema);