const mongoose = require("mongoose");
const schema = mongoose.Schema;
let kycStatus = require('../enums/kycStatus');
var userSchema = new schema(
        {
                fullName: {
                        type: String,
                },
                firstName: {
                        type: String,
                },
                lastName: {
                        type: String,
                },
                language: {
                        type: String,
                },
                image: {
                        type: String,
                },
                gender: {
                        type: String,
                },
                dob: {
                        type: String,
                },
                country: {
                        type: String,
                },
                phone: {
                        type: String,
                        minLength: 8,
                        maxLength: 12,
                },
                email: {
                        type: String,
                        minLength: 10,
                },
                refferalCode: {
                        type: String,
                },
                password: {
                        type: String,
                },
                otp: {
                        type: String,
                },
                otpExpiration: {
                        type: Date,
                },
                accountVerification: {
                        type: Boolean,
                        default: false,
                },
                kycDocumentId: {
                        type: schema.Types.ObjectId,
                        ref: "vendorKyc"
                },
                kybDocumentId: {
                        type: schema.Types.ObjectId,
                        ref: "vendorKyb"
                },
                kycStatus: {
                        type: String,
                },
                kybStatus: {
                        type: String,
                },
                userType: {
                        type: String,
                        enum: ["USER", "ADMIN", "VENDOR"],
                },
                status: {
                        type: String,
                        enum: ["Active", "Block"],
                },
                wallet: {
                        type: Number,
                        default: 0,
                },
        },
        { timestamps: true }
);
module.exports = mongoose.model("user", userSchema);
