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
        certIncorRegi: {
                type: String
        },
        excerptStateCompanyRegi: {
                type: String
        },
        certIncorIncumbency: {
                type: String
        },
        CertGoodStanding: {
                type: String
        },
        memorandum: {
                type: String
        },
        UBOs: {
                type: Boolean,
                default: false
        },
        uboShareholderRegi: {
                type: String
        },
        uboStatOfInformation: {
                type: String
        },
        uboExcerptStateCompanyRegi: {
                type: String
        },
        uboCertIncorIncumbency: {
                type: String
        },
        uboMemorandum: {
                type: String
        },
        uboTrustAgreement: {
                type: String
        },
        usEIN: {
                type: Boolean,
                default: false
        },
        numberEIN: {
                type: String
        },
        evidence: {
                type: String
        },
        kybStatus: {
                type: String,
                default: kycStatus.UPLOADED
        },
        status: {
                type: String,
                default: status.ACTIVE
        },
}, { timestamps: true })
DocumentSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("vendorKyb", DocumentSchema);