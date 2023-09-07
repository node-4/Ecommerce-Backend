const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authConfig = require("../configs/auth.config");
var newOTP = require("otp-generators");
const User = require("../models/userModel");
const categoryType = require('../enums/categoryType');
const kycStatus = require('../enums/kycStatus');
const openClose = require('../enums/openClose');
const orderStatus = require("../enums/orderStatus");
const paymentKey = require('../enums/paymentKey');
const paymentMode = require('../enums/paymentMode');
const paymentStatus = require('../enums/paymentStatus');
const status = require('../enums/status');
const stockStatus = require('../enums/stockStatus');
const userType = require('../enums/userType');
const color = require('../models/color');
const quantityUnit = require('../models/quantityUnit');
const Category = require("../models/categoryModel");
const subCategory = require("../models/subCategoryModel");
const product = require('../models/productModel');
const productVarient = require('../models/productVarient');
const order = require("../models/order/orderModel");
const userOrders = require("../models/order/userOrders");
const vendorKyc = require("../models/vendorKyc");
const vendorKyb = require("../models/vendorKyb");
const cancelReturnOrder = require("../models/order/cancelReturnOrder");
const offer = require('../models/offer');
exports.registration = async (req, res) => {
        try {
                const { phone, userType } = req.body;
                const user = await User.findOne({ phone: phone, userType: userType });
                if (!user) {
                        req.body.refferalCode = await reffralCode();
                        if (userType == "VENDOR") {
                                req.body.kycStatus = kycStatus.PENDING;
                                req.body.kybStatus = kycStatus.PENDING;
                        }
                        if (userType == "USER") {
                                req.body.kycStatus = kycStatus.APPROVED;
                                req.body.kybStatus = kycStatus.APPROVED;
                                req.body.status = "Active";
                        }
                        req.body.password = bcrypt.hashSync(req.body.password);
                        req.body.otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                        req.body.otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                        req.body.accountVerification = false;
                        const userCreate = await User.create(req.body)
                        return res.status(200).send({ status: 200, message: "Registered successfully ", data: userCreate, });
                } else {
                        return res.status(409).send({ status: 409, msg: "Already Exit" });
                }
        } catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Server error" });
        }
};
exports.verifyOtp = async (req, res) => {
        try {
                const { otp } = req.body;
                const user = await User.findById({ _id: req.params.id });
                if (!user) {
                        return res.status(404).send({ message: "user not found" });
                }
                if (user.otp !== otp || user.otpExpiration < Date.now()) {
                        return res.status(400).json({ message: "Invalid OTP" });
                }
                const updated = await User.findByIdAndUpdate({ _id: user._id }, { accountVerification: true }, { new: true });
                return res.status(200).send({ status: 200, message: "logged in successfully", data: updated });
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({ error: "internal server error" + err.message });
        }
};
exports.resendOTP = async (req, res) => {
        const { id } = req.params;
        try {
                const user = await User.findOne({ _id: id, userType: userType.VENDOR });
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                }
                const otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                const accountVerification = false;
                const updated = await User.findOneAndUpdate({ _id: user._id }, { otp, otpExpiration, accountVerification }, { new: true });
                let obj = {
                        id: updated._id,
                        otp: updated.otp,
                        phone: updated.phone
                }
                return res.status(200).send({ status: 200, message: "OTP resent", data: obj });
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.getProfile = async (req, res) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        return res.status(200).json({ status: 200, message: "get Profile", data: data });
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.socialLogin = async (req, res) => {
        try {
                const { firstName, lastName, email, phone, userType } = req.body;
                const user = await User.findOne({ $and: [{ $or: [{ email }, { phone }] }, { userType: userType }] });
                if (user) {
                        jwt.sign({ id: user._id }, authConfig.secret, (err, accessToken) => {
                                if (err) {
                                        return res.status(401).send("Invalid Credentials");
                                } else {
                                        let obj = {
                                                userType: user.userType,
                                                kycStatus: user.kycStatus,
                                                accessToken: accessToken
                                        }
                                        return res.status(200).json({ status: 200, msg: "Login successfully", data: obj });
                                }
                        });
                } else {
                        let kycStatus;
                        if (userType == "VENDOR") {
                                req.body.kycStatus = kycStatus.PENDING;
                                req.body.kybStatus = kycStatus.PENDING;
                        }
                        if (userType == "USER") {
                                req.body.kycStatus = kycStatus.APPROVED;
                                req.body.kybStatus = kycStatus.APPROVED;
                                req.body.status = "Active";
                        }
                        let refferalCode = await reffralCode();
                        const newUser = await User.create({ firstName, lastName, phone, email, kycStatus, refferalCode, userType: userType });
                        if (newUser) {
                                jwt.sign({ id: newUser._id }, authConfig.secret, (err, accessToken) => {
                                        if (err) {
                                                return res.status(401).send("Invalid Credentials");
                                        } else {
                                                let obj = {
                                                        userType: newUser.userType,
                                                        kycStatus: newUser.kycStatus,
                                                        accessToken: accessToken
                                                }
                                                return res.status(200).json({ status: 200, msg: "Login successfully", data: obj });
                                        }
                                });
                        }
                }
        } catch (err) {
                console.error(err);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.forgetPassword = async (req, res) => {
        const { email } = req.params;
        try {
                const user = await User.findOne({ email: req.body.email, userType: req.body.userType });
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                }
                const otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                const accountVerification = false;
                const updated = await User.findOneAndUpdate({ _id: user._id }, { otp, otpExpiration, accountVerification }, { new: true });
                let obj = {
                        id: updated._id,
                        otp: updated.otp,
                        phone: updated.phone
                }
                return res.status(200).send({ status: 200, message: "OTP resent", data: obj });
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.resetPassword = async (req, res) => {
        try {
                const user = await User.findOne({ email: req.body.email, userType: req.body.userType });
                if (!user) {
                        return res.status(404).send({ message: "User not found" });
                } else {
                        if (user.otp !== req.body.otp || user.otpExpiration < Date.now()) {
                                return res.status(400).json({ message: "Invalid OTP" });
                        } else {
                                if (req.body.newPassword == req.body.confirmPassword) {
                                        const updated = await User.findOneAndUpdate({ _id: user._id }, { $set: { password: bcrypt.hashSync(req.body.newPassword) } }, { new: true });
                                        return res.status(200).send({ message: "Password update successfully.", data: updated, });
                                } else {
                                        return res.status(501).send({ message: "Password Not matched.", data: {}, });
                                }
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.signin = async (req, res) => {
        try {
                const { email, password, userType } = req.body;
                const user = await User.findOne({ email: email, userType: userType });
                if (!user) {
                        return res.status(404).send({ message: "user not found ! not registered" });
                }
                if (user.accountVerification == false) {
                        return res.status(401).send({ message: "Your otp account verification not verifed." });
                }
                const isValidPassword = bcrypt.compareSync(password, user.password);
                if (!isValidPassword) {
                        return res.status(401).send({ message: "Wrong password" });
                }
                const accessToken = jwt.sign({ id: user._id }, authConfig.secret, { expiresIn: authConfig.accessTokenTime, });
                let obj = {
                        userType: user.userType,
                        kycStatus: user.kycStatus,
                        kybStatus: user.kybStatus,
                        accessToken: accessToken
                }
                return res.status(201).send({ message: "Login successfully", data: obj });
        } catch (error) {
                console.error(error);
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.addQuantityUnit = async (req, res) => {
        try {
                let vendorResult = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorResult) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        req.body.unit = (req.body.unit).toUpperCase();
                        req.body.vendorId = vendorResult._id;
                        let findQuantityUnit = await quantityUnit.findOne({ unit: req.body.unit, vendorId: req.body.vendorId, status: status.ACTIVE });
                        if (findQuantityUnit) {
                                return res.status(409).send({ status: 409, message: "Already Exit", data: {} });
                        } else {
                                let result = await quantityUnit(req.body).save();
                                if (result) {
                                        return res.status(200).send({ status: 200, message: "Add Quantity unit saved successfully.", data: result });
                                }
                        }
                }
        } catch (error) {
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.viewQuantityUnit = async (req, res) => {
        try {
                let findQuantityUnit = await quantityUnit.findById({ _id: req.params.id, status: { $ne: status.DELETE } });
                if (!findQuantityUnit) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        return res.status(200).send({ status: 200, message: "Quantity unit found successfully.", data: findQuantityUnit });
                }
        } catch (error) {
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.editQuantityUnit = async (req, res) => {
        try {
                let vendorResult = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorResult) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findQuantityUnit = await quantityUnit.findOne({ _id: req.params.id, vendorId: vendorResult._id, });
                        if (!findQuantityUnit) {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        } else {
                                req.body.unit = (req.body.unit).toUpperCase();
                                let findQuantityUnit1 = await quantityUnit.findOne({ _id: { $ne: findQuantityUnit._id }, vendorId: vendorResult._id, unit: req.body.unit, status: status.ACTIVE });
                                if (findQuantityUnit1) {
                                        return res.status(409).send({ status: 409, message: "Already Exit", data: {} });
                                } else {
                                        let update = await quantityUnit.findByIdAndUpdate({ _id: findQuantityUnit._id }, { $set: { unit: req.body.unit } }, { new: true })
                                        return res.status(200).send({ status: 200, message: "Quantity unit update successfully.", data: update });
                                }
                        }
                }
        } catch (error) {
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.deleteQuantityUnit = async (req, res) => {
        try {
                let vendorResult = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorResult) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
                else {
                        let findQuantityUnit = await quantityUnit.findById({ _id: req.params.id });
                        if (!findQuantityUnit) {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        } else {
                                let updates = await quantityUnit.findByIdAndDelete({ _id: findQuantityUnit._id });
                                if (updates) {
                                        return res.status(200).send({ status: 200, message: "Quantity unit Delete successfully.", data: updates });
                                }
                        }
                }
        } catch (error) {
                console.log(error)
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.listQuantityUnit = async (req, res) => {
        try {
                let vendorResult = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorResult) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
                else {
                        let findQuantityUnit = await quantityUnit.find({ vendorId: vendorResult._id, status: { $ne: status.DELETE } });
                        if (findQuantityUnit.length == 0) {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        } else {
                                return res.status(200).send({ status: 200, message: "Quantity unit data found successfully.", data: findQuantityUnit });
                        }
                }
        } catch (error) {
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.addColor = async (req, res) => {
        try {
                let vendorResult = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorResult) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        req.body.color = (req.body.color).charAt(0).toUpperCase() + (req.body.color).slice(1);
                        req.body.vendorId = vendorResult._id;
                        let findColor = await color.findOne({ color: req.body.color, colorCode: req.body.colorCode, vendorId: req.body.vendorId, status: status.ACTIVE });
                        if (findColor) {
                                return res.status(409).send({ status: 409, message: "Already Exit", data: {} });
                        } else {
                                req.body.appName = vendorResult.appName;
                                let result = await color(req.body).save();
                                if (result) {
                                        return res.status(200).send({ status: 200, message: "Color data saved successfully.", data: result });
                                }
                        }
                }
        } catch (error) {
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.viewColor = async (req, res) => {
        try {
                let findColor = await color.findById({ _id: req.params.id }).populate('vendorId')
                if (!findColor) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        return res.status(200).send({ status: 200, message: "Color data found successfully.", data: findColor });
                }
        } catch (error) {
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.editColor = async (req, res) => {
        try {
                let vendorResult = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorResult) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findColor = await color.findOne({ _id: req.params.id, vendorId: vendorResult._id, });
                        if (!findColor) {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        } else {
                                req.body.color = (req.body.color).charAt(0).toUpperCase() + (req.body.color).slice(1);
                                let findColor1 = await color.findOne({ _id: { $ne: findColor._id }, color: req.body.color, colorCode: req.body.colorCode, vendorId: vendorResult._id, status: status.ACTIVE });
                                if (findColor1) {
                                        return res.status(409).send({ status: 409, message: "Already Exit", data: {} });
                                } else {
                                        let update = await color.findByIdAndUpdate({ _id: findColor._id }, { $set: { color: req.body.color, colorCode: req.body.colorCode } }, { new: true })
                                        return res.status(200).send({ status: 200, message: "Color data update successfully.", data: update });
                                }
                        }
                }
        } catch (error) {
                console.log("Error========", error)
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.deleteColor = async (req, res) => {
        try {
                let vendorResult = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorResult) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
                else {
                        let findColor = await color.findById({ _id: req.params.id });
                        if (!findColor) {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        } else {
                                let updates = await color.findOneAndUpdate({ _id: findColor._id }, { $set: { status: status.DELETE } }, { new: true });
                                if (updates) {
                                        return res.status(200).send({ status: 200, message: "Color data delete successfully.", data: updates });
                                }
                        }
                }
        } catch (error) {
                console.log(error)
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.listColor = async (req, res) => {
        try {
                let vendorResult = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorResult) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findColor = await color.find({ vendorId: vendorResult._id, status: { $ne: status.DELETE } });
                        if (findColor.length == 0) {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        } else {
                                return res.status(200).send({ status: 200, message: "Color data found successfully.", data: findColor });
                        }
                }
        } catch (error) {
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.addProduct = async (req, res) => {
        try {
                let vendorResult = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorResult) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findCategory = await Category.findById({ _id: req.body.categoryId });
                        if (!findCategory) {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        } else {
                                let findSubCategory = await subCategory.findOne({ _id: req.body.subCategoryId, categoryId: findCategory._id });
                                if (!findSubCategory) {
                                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                } else {
                                        let productImage = [], discountPrice, varient, size, viewOnwebsite, stockStatus;
                                        if (req.files) {
                                                for (let i = 0; i < req.files.length; i++) {
                                                        productImage.push(req.files[i].path);
                                                }
                                        }
                                        if (req.body.discountActive == "true") {
                                                discountPrice = Number(req.body.originalPrice - ((req.body.originalPrice * req.body.discount) / 100)).toFixed(2)
                                        } else {
                                                discountPrice = 0;
                                        }
                                        if (req.body.varient == "true") {
                                                varient = true;
                                                viewOnwebsite = "ACTIVE"
                                        } else {
                                                varient = false;
                                                viewOnwebsite = "BLOCK";
                                                if (req.body.size == "true") {
                                                        size = true;
                                                        viewOnwebsite = "BLOCK"
                                                } else {
                                                        size = false;
                                                        viewOnwebsite = "ACTIVE";
                                                        if (req.body.stock < 50) {
                                                                stockStatus = "LOW";
                                                        } else if (req.body.stock > 50) {
                                                                stockStatus = "ADEQUATE";
                                                        } else if (req.body.stock = 0) {
                                                                stockStatus = "OUTOFSTOCK";
                                                        }
                                                }
                                        }
                                        let obj = {
                                                vendorId: vendorResult._id,
                                                categoryId: findCategory._id,
                                                subcategoryId: findSubCategory._id,
                                                gender: findCategory.gender,
                                                productName: req.body.productName,
                                                productImage: productImage,
                                                originalPrice: req.body.originalPrice,
                                                discountPrice: discountPrice,
                                                discountActive: req.body.discountActive,
                                                discount: req.body.discount || 0,
                                                description: req.body.description,
                                                returnPolicy: req.body.returnPolicy,
                                                varient: varient,
                                                viewOnwebsite: viewOnwebsite,
                                                size: size,
                                                stockStatus: stockStatus,
                                                stock: req.body.stock,
                                                minimunOrderUnit: req.body.minimunOrderUnit,
                                                productType: req.body.productType
                                        }
                                        let saveStore = await product(obj).save();
                                        if (saveStore) {
                                                return res.status(200).send({ status: 200, message: "Product add successfully.", data: saveStore });
                                        }
                                }
                        }
                }
        } catch (error) {
                console.log("error", error)
                return res.status(500).send({ message: "Server error" + error.message });
        }
}
exports.viewProduct = async (req, res) => {
        try {
                let findProduct = await product.findById({ _id: req.params.id }).populate('categoryId subcategoryId').populate({ path: "reviews.user", select: "fullName" });
                if (findProduct) {
                        return res.status(200).send({ status: 200, message: "Product data found successfully.", data: findProduct });
                } else {
                        return res.status(404).json({ status: 404, message: "Product not found", data: {} });
                }
        } catch (error) {
                console.log("error", error)
                return res.status(500).send({ message: "Server error" + error.message });
        }
}
exports.editProduct = async (req, res) => {
        try {
                let vendorResult = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorResult) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findProduct = await product.findById({ _id: req.params.id });
                        if (findProduct) {
                                let findCategory, findSubCategory;
                                if (req.body.categoryId != (null || undefined)) {
                                        findCategory = await Category.findById({ _id: req.body.categoryId });
                                        if (!findCategory) {
                                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                        }
                                }
                                if (req.body.subCategoryId != (null || undefined)) {
                                        findSubCategory = await subCategory.findOne({ _id: req.body.subCategoryId, categoryId: findCategory._id || findProduct.categoryId });
                                        if (!findSubCategory) {
                                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                        }
                                }
                                let productImage = [], discountPrice, varient, size, viewOnwebsite, stockStatus;
                                if (req.files) {
                                        for (let i = 0; i < req.files.length; i++) {
                                                productImage.push(req.files[i].path);
                                        }
                                }
                                if (req.body.discountActive == "true") {
                                        discountPrice = Number(req.body.originalPrice - ((req.body.originalPrice * req.body.discount) / 100)).toFixed(2)
                                } else {
                                        discountPrice = 0;
                                }
                                if (req.body.varient == "true") {
                                        varient = true;
                                        viewOnwebsite = "ACTIVE"
                                } else {
                                        varient = false;
                                        viewOnwebsite = "BLOCK";
                                        if (req.body.size == "true") {
                                                size = true;
                                                viewOnwebsite = "BLOCK"
                                        } else {
                                                size = false;
                                                viewOnwebsite = "ACTIVE";
                                                if (req.body.stock < 50) {
                                                        stockStatus = "LOW";
                                                } else if (req.body.stock > 50) {
                                                        stockStatus = "ADEQUATE";
                                                } else if (req.body.stock = 0) {
                                                        stockStatus = "OUTOFSTOCK";
                                                }
                                        }
                                }
                                let obj = {
                                        vendorId: vendorResult._id,
                                        categoryId: findCategory._id || findProduct.categoryId,
                                        subcategoryId: findSubCategory._id || findProduct.subcategoryId,
                                        gender: findCategory.gender || findProduct.gender,
                                        productName: req.body.productName || findProduct.productName,
                                        productImage: productImage || findProduct.productImage,
                                        originalPrice: req.body.originalPrice || findProduct.originalPrice,
                                        discountPrice: discountPrice || findProduct.discountPrice,
                                        discountActive: req.body.discountActive || findProduct.discountActive,
                                        discount: req.body.discount || findProduct.discount,
                                        description: req.body.description || findProduct.description,
                                        returnPolicy: req.body.returnPolicy || findProduct.returnPolicy,
                                        varient: varient || findProduct.varient,
                                        viewOnwebsite: viewOnwebsite || findProduct.viewOnwebsite,
                                        size: size || findProduct.size,
                                        stockStatus: stockStatus || findProduct.stockStatus,
                                        stock: req.body.stock || findProduct.stock,
                                        minimunOrderUnit: req.body.minimunOrderUnit || findProduct.minimunOrderUnit,
                                        productType: req.body.productType || findProduct.productType,
                                }
                                let saveStore = await product.findByIdAndUpdate({ _id: findProduct._id }, { $set: obj }, { new: true });
                                if (saveStore) {
                                        return res.status(200).send({ status: 200, message: "Product update successfully.", data: saveStore });
                                }

                        } else {
                                return res.status(404).json({ status: 404, message: "Product not found", data: {} });
                        }
                }
        } catch (error) {
                console.log("error", error)
                return res.status(500).send({ message: "Server error" + error.message });
        }
}
exports.deleteProduct = async (req, res) => {
        try {
                let findProduct = await product.findById({ _id: req.params.id });
                if (findProduct) {
                        let findVarient = await productVarient.find({ productId: findProduct._id });
                        if (findVarient.length > 0) {
                                let count = 0, totalVarient = findVarient.length;
                                for (let i = 0; i < findVarient.length; i++) {
                                        await productVarient.findByIdAndDelete({ _id: findVarient[i]._id });
                                        count++;
                                }
                                if ((count == totalVarient) == true) {
                                        let deletes = await product.findByIdAndDelete({ _id: findProduct._id });
                                        if (deletes) {
                                                return res.status(200).send({ status: 200, message: "Product delete successfully.", data: {} });
                                        }
                                }
                        } else {
                                let deletes = await product.findByIdAndDelete({ _id: findProduct._id });
                                if (deletes) {
                                        return res.status(200).send({ status: 200, message: "Product delete successfully.", data: {} });
                                }
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "Product not found", data: {} });
                }
        } catch (error) {
                console.log("error", error)
                return res.status(500).send({ message: "Server error" + error.message });
        }
}
exports.listProduct = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let query = { vendorId: vendorData._id, status: { $ne: "DELETE" } };
                        if (req.query.categoryId) {
                                query.categoryId = req.query.categoryId;
                        }
                        if (req.query.subcategoryId) {
                                query.subcategoryId = req.query.subcategoryId;
                        }
                        if (req.query.search) {
                                query.productName = req.query.search;
                        }
                        if ((req.query.fromDate != 'null') && (req.query.toDate == 'null')) {
                                query.createdAt = { $gte: req.query.fromDate };
                        }
                        if ((req.query.fromDate == 'null') && (req.query.toDate != 'null')) {
                                query.createdAt = { $lte: req.query.toDate };
                        }
                        if ((req.query.fromDate != 'null') && (req.query.toDate != 'null')) {
                                query.$and = [
                                        { createdAt: { $gte: req.query.fromDate } },
                                        { createdAt: { $lte: req.query.toDate } },
                                ]
                        }
                        var limit = parseInt(req.query.limit);
                        var options = {
                                page: parseInt(req.query.page) || 1,
                                limit: limit || 10,
                                sort: { createdAt: -1 },
                                populate: { path: 'categoryId subcategoryId' }
                        }
                        product.paginate(query, options, (transErr, transRes) => {
                                if (transErr) {
                                        return res.status(501).send({ message: "Internal Server error" + transErr.message });
                                } else if (transRes.docs.length == 0) {
                                        return res.status(200).json({ status: 200, message: "No data found", data: [] });
                                } else {
                                        return res.status(200).send({ status: 200, message: "Product data found successfully.", data: transRes });
                                }
                        })
                }
        } catch (error) {
                console.log(error)
                return res.status(500).send({ message: "Internal Server error" + error.message });
        }
};
exports.addProductVarient = async (req, res) => {
        try {
                let vendorResult = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorResult) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findProduct = await product.findById({ _id: req.body.productId, vendorId: vendorResult._id });
                        if (!findProduct) {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        } else {
                                if (findProduct.varient == true) {
                                        return res.status(201).json({ status: 201, message: "You can not add size, first add color varient", data: {} });
                                }
                                if (findProduct.size == true) {
                                        let findQuantity = await quantityUnit.findOne({ vendorId: vendorResult._id, _id: req.body.unitId, status: status.ACTIVE });
                                        if (!findQuantity) {
                                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                        } else {
                                                let stockStatus;
                                                if (req.body.stock < 50) {
                                                        stockStatus = "LOW";
                                                } else if (req.body.stock > 50) {
                                                        stockStatus = "ADEQUATE";
                                                } else if (req.body.stock = 0) {
                                                        stockStatus = "OUTOFSTOCK";
                                                }
                                                let obj = {
                                                        vendorId: findProduct.vendorId,
                                                        productId: findProduct._id,
                                                        unitId: findQuantity._id,
                                                        unitInwords: findQuantity.unit,
                                                        stock: req.body.stock,
                                                        stockStatus: stockStatus,
                                                }
                                                let saveProductVarient = await productVarient(obj).save();
                                                if (saveProductVarient) {
                                                        return res.status(200).send({ status: 200, message: "Product varient add successfully.", data: saveProductVarient });
                                                }
                                        }
                                }
                        }
                }
        } catch (error) {
                console.log("error", error)
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.viewProductVarient = async (req, res) => {
        try {
                let findVarient = await productVarient.findById({ _id: req.params.id }).populate({ path: 'productId', populate: [{ path: 'categoryId', model: 'Category' }, { path: 'subcategoryId', model: 'subcategory' }] }).populate('color')
                if (!findVarient) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        return res.status(200).send({ status: 200, message: "Product varient data found successfully.", data: findVarient });
                }
        } catch (error) {
                console.log("error", error)
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.editProductVarient = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let unitId, unitInwords;
                        let findVarient = await productVarient.findById({ _id: req.params.id });
                        if (!findVarient) {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        } else {
                                if (req.body.unitId) {
                                        let findQuantity = await quantityUnit.findOne({ _id: req.body.unitId, vendorId: findVarient.vendorId });
                                        if (!findQuantity) {
                                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                        } else {
                                                unitId = findQuantity._id;
                                                unitInwords = findQuantity.unit;
                                        }
                                } else {
                                        unitId = findVarient.unitId;
                                        unitInwords = findVarient.unitInwords
                                }
                                let stockStatus;
                                if (req.body.stock < 50) {
                                        stockStatus = "LOW";
                                } else if (req.body.stock > 50) {
                                        stockStatus = "ADEQUATE";
                                } else if (req.body.stock = 0) {
                                        stockStatus = "OUTOFSTOCK";
                                }
                                let findProduct = await product.findById({ _id: findVarient.productId });
                                if (!findProduct) {
                                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                }
                                req.body.vendorId = findProduct.vendorId;
                                req.body.productId = findVarient.productId;
                                req.body.unitId = unitId;
                                req.body.unitInwords = unitInwords;
                                req.body.stock = req.body.stock;
                                req.body.stockStatus = stockStatus;
                                let saveProductVarient = await productVarient.findByIdAndUpdate({ _id: findVarient._id }, { $set: req.body }, { new: true })
                                if (saveProductVarient) {
                                        return res.status(200).json({ status: 200, message: "Varient update successfully.", data: saveProductVarient });
                                }
                        }
                }
        } catch (error) {
                console.log("error", error)
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.uploadImageInVarient = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findVarient = await productVarient.findById({ _id: req.params.id });
                        if (!findVarient) {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        } else {
                                let obj, productImage;
                                if (req.files) {
                                        for (let i = 0; i < req.files.length; i++) {
                                                productImage = req.files[i].path
                                                obj = {
                                                        image: productImage
                                                }
                                                await productVarient.findByIdAndUpdate({ _id: findVarient._id }, { $push: { productImages: obj } }, { new: true });
                                        }
                                }
                                let findVarient1 = await productVarient.findById({ _id: req.params.id });
                                if (findVarient1) {
                                        return res.status(200).send({ status: 200, message: "Image add in varient successfully..", data: findVarient1 });
                                }
                        }
                }
        } catch (error) {
                console.log("error", error)
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.deleteProductVarient = async (req, res) => {
        try {
                let vendorResult = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorResult) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findVarient = await productVarient.findOne({ _id: req.params.id });
                        if (!findVarient) {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        } else {
                                let update = await productVarient.findByIdAndDelete({ _id: findVarient._id });
                                if (update) {
                                        return res.status(200).send({ status: 200, message: "Product varient delete successfully.", data: {} });
                                }
                        }
                }
        } catch (error) {
                console.log("error", error)
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.listProductVarient = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        if (vendorData.userType == userType.VENDOR) {
                                if (req.query.productId) {
                                        let findVarient = await productVarient.find({ vendorId: vendorData._id, productId: req.query.productId, }).populate({ path: 'productId', populate: [{ path: 'categoryId', model: 'Category' }, { path: 'subcategoryId', model: 'subcategory' }] }).populate('color')
                                        if (findVarient.length == 0) {
                                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                        } else {
                                                return res.status(200).send({ status: 200, message: "Product varient data found successfully.", data: findVarient });
                                        }
                                } else {
                                        let findVarient = await productVarient.find({ vendorId: vendorData._id, }).populate({ path: 'productId', populate: [{ path: 'categoryId', model: 'Category' }, { path: 'subcategoryId', model: 'subcategory' }] }).populate('color');
                                        if (findVarient.length == 0) {
                                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                        } else {
                                                return res.status(200).send({ status: 200, message: "Product varient data found successfully.", data: findVarient });
                                        }
                                }
                        } else {
                                if (req.query.productId) {
                                        let findVarient = await productVarient.find({ productId: req.query.productId, }).populate({ path: 'productId', populate: [{ path: 'categoryId', model: 'Category' }, { path: 'subcategoryId', model: 'subcategory' }] }).populate('color')
                                        if (findVarient.length == 0) {
                                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                        } else {
                                                return res.status(200).send({ status: 200, message: "Product varient data found successfully.", data: findVarient });
                                        }
                                } else {
                                        let findVarient = await productVarient.find({}).populate({ path: 'productId', populate: [{ path: 'categoryId', model: 'Category' }, { path: 'subcategoryId', model: 'subcategory' }] }).populate('color');
                                        if (findVarient.length == 0) {
                                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                        } else {
                                                return res.status(200).send({ status: 200, message: "Product varient data found successfully.", data: findVarient });
                                        }
                                }
                        }
                }
        } catch (error) {
                return res.status(500).send({ message: "Internal Server error" + error.message });
        }
};
exports.addColorInProduct = async (req, res) => {
        try {
                let vendorResult = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorResult) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findProduct = await product.findById({ _id: req.body.productId, vendorId: vendorResult._id });
                        if (!findProduct) {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        } else {
                                if (findProduct.varient == true) {
                                        let findColor = await color.findById({ _id: req.body.colorId });
                                        if (!findColor) {
                                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                        } else {
                                                let findVarient = await productVarient.findOne({ productId: findProduct._id, color: findColor._id });
                                                if (findVarient) {
                                                        return res.status(409).json({ status: 409, message: "ALREADY EXIST", data: {} });
                                                } else {
                                                        let productImages = [];
                                                        if (req.files) {
                                                                for (let i = 0; i < req.files.length; i++) {
                                                                        let obj = {
                                                                                image: req.files[i].path
                                                                        }
                                                                        productImages.push(obj);
                                                                }
                                                        }
                                                        if (req.body.size == "true") {
                                                                req.body.size = true;
                                                        } else {
                                                                req.body.size = false;
                                                                req.body.stock = req.body.stock;
                                                                if (req.body.stock < 50) {
                                                                        req.body.stockStatus = "LOW";
                                                                } else if (req.body.stock > 50) {
                                                                        req.body.stockStatus = "ADEQUATE";
                                                                } else if (req.body.stock = 0) {
                                                                        req.body.stockStatus = "OUTOFSTOCK";
                                                                }
                                                        }
                                                        req.body.vendorId = findProduct.vendorId;
                                                        req.body.productId = findProduct._id;
                                                        req.body.color = findColor._id;
                                                        req.body.productImages = productImages;
                                                        let saveProductVarient = await productVarient(req.body).save();
                                                        if (saveProductVarient) {
                                                                if (req.body.size == "true") {
                                                                        return res.status(200).send({ status: 200, message: "Add color varient in Product successfully now you can add size.", data: saveProductVarient });
                                                                } else {
                                                                        return res.status(200).send({ status: 200, message: "Add color varient in Product successfully.", data: saveProductVarient });
                                                                }
                                                        }
                                                }
                                        }
                                }
                                if (findProduct.size == true) {
                                        return res.status(201).json({ status: 201, message: "You can not add color, only size can be added.", data: {} });
                                }
                        }
                }
        } catch (error) {
                console.log("error", error)
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.editColorInProduct = async (req, res) => {
        try {
                let vendorResult = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorResult) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findVarient = await productVarient.findById({ _id: req.params.id });
                        if (!findVarient) {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        } else {
                                let findColor;
                                if (req.body.colorId != (null || undefined)) {
                                        findColor = await color.findById({ _id: req.body.colorId });
                                        if (!findColor) {
                                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                        } else {
                                                let findVarient1 = await productVarient.findOne({ _id: { $ne: findVarient._id }, productId: findVarient.productId, color: findColor._id });
                                                if (findVarient1) {
                                                        return res.status(409).json({ status: 409, message: "ALREADY EXIST", data: {} });
                                                }
                                        }
                                }
                                let productImages = [];
                                if (req.files) {
                                        for (let i = 0; i < req.files.length; i++) {
                                                let obj = {
                                                        image: req.files[i].path
                                                }
                                                productImages.push(obj);
                                        }
                                }
                                if (req.body.size != (null || undefined)) {
                                        if (req.body.size == "true") {
                                                req.body.size = true;
                                        } else {
                                                req.body.size = false;
                                                req.body.stock = req.body.stock;
                                                if (req.body.stock < 50) {
                                                        req.body.stockStatus = "LOW";
                                                } else if (req.body.stock > 50) {
                                                        req.body.stockStatus = "ADEQUATE";
                                                } else if (req.body.stock = 0) {
                                                        req.body.stockStatus = "OUTOFSTOCK";
                                                }
                                        }
                                }
                                req.body.vendorId = findVarient.vendorId;
                                req.body.productId = findVarient.productId;
                                req.body.color = findColor._id || findVarient.color;
                                req.body.productImages = productImages || findVarient.productImages;
                                req.body.stockStatus = req.body.stockStatus || findVarient.stockStatus;
                                req.body.size = req.body.size || findVarient.size;
                                req.body.stock = req.body.stock || findVarient.stock;
                                req.body.colorsUnits = req.body.colorsUnits || findVarient.colorsUnits;
                                req.body.status = req.body.status || findVarient.status;
                                let saveProductVarient = await productVarient.findByIdAndUpdate({ _id: findVarient._id }, { $set: req.body }, { new: true })
                                if (saveProductVarient) {
                                        return res.status(200).send({ status: 200, message: "Add color varient in Product successfully.", data: saveProductVarient });
                                }

                        }
                }
        } catch (error) {
                console.log("error", error)
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.addVarientInColor = async (req, res) => {
        try {
                let vendorResult = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorResult) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findVarient = await productVarient.findOne({ _id: req.body.varientId });
                        if (!findVarient) {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        } else {
                                let findQuantity = await quantityUnit.findOne({ vendorId: vendorResult._id, _id: req.body.unitId, status: status.ACTIVE });
                                if (!findQuantity) {
                                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                } else {
                                        let stockStatus;
                                        if (req.body.stock < 50) {
                                                stockStatus = "LOW";
                                        } else if (req.body.stock > 50) {
                                                stockStatus = "ADEQUATE";
                                        } else if (req.body.stock = 0) {
                                                stockStatus = "OUTOFSTOCK";
                                        }
                                        let obj = {
                                                unitId: findQuantity._id,
                                                unitInwords: findQuantity.unit,
                                                stock: req.body.stock,
                                                stockStatus: stockStatus,
                                        }
                                        let saveProductVarient = await productVarient.findByIdAndUpdate({ _id: findVarient._id }, { $push: { colorsUnits: obj } }, { new: true })
                                        if (saveProductVarient) {
                                                return res.status(200).send({ status: 200, message: "Add size in color varient successfully.", data: saveProductVarient });
                                        }
                                }
                        }
                }
        } catch (error) {
                console.log("error", error)
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.editVarientInColor = async (req, res) => {
        try {
                let vendorResult = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorResult) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findVarient = await productVarient.findOne({ _id: req.params.id });
                        if (!findVarient) {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        } else {
                                for (let i = 0; i < findVarient.colorsUnits.length; i++) {
                                        let colorVarientId = findVarient.colorsUnits[i]._id;
                                        if (req.body.colorVarientId == colorVarientId) {
                                                let stockStatus;
                                                req.body.stock = req.body.stock || findVarient.colorsUnits[i].stock;
                                                if (req.body.stock < 50) {
                                                        stockStatus = "LOW";
                                                } else if (req.body.stock > 50) {
                                                        stockStatus = "ADEQUATE";
                                                } else if (req.body.stock = 0) {
                                                        stockStatus = "OUTOFSTOCK";
                                                }
                                                req.body.stock = req.body.stock;
                                                req.body.stockStatus = stockStatus;
                                                let updates = await productVarient.findOneAndUpdate({ color: findVarient.color, "colorsUnits._id": req.body.colorVarientId }, { $set: { "colorsUnits.$.stock": req.body.stock, "colorsUnits.$.stockStatus": req.body.stockStatus } }, { new: true })
                                                if (updates) {
                                                        return res.status(200).send({ status: 200, message: "Color size update successfully..", data: updates });
                                                }
                                        }
                                }
                        }
                }
        } catch (error) {
                console.log("error", error)
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.deleteVarientInColor = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findVarient = await productVarient.findOne({ _id: req.params.id });
                        if (!findVarient) {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        } else {
                                for (let i = 0; i < findVarient.colorsUnits.length; i++) {
                                        if (findVarient.colorsUnits[i].unitId == req.query.unitId) {
                                                await productVarient.findOneAndUpdate({ 'colorsUnits._id': req.query.colorVarientId }, { $pull: { 'colorsUnits': { unitId: req.query.unitId, _id: req.query.colorVarientId } } }, { new: true });
                                        }
                                }
                                const findVarient1 = await productVarient.findById({ _id: req.params.id });
                                if (findVarient1) {
                                        return res.status(200).send({ status: 200, message: "Color size delete successfully..", data: findVarient1 });
                                }
                        }
                }
        } catch (error) {
                console.log("error", error)
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.deleteImagefromVarient = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user._id, userType: userType.VENDOR });
                if (!vendorData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        const data = await productVarient.findById({ _id: req.params.id });
                        if (!data) {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        } else {
                                for (let i = 0; i < data.productImages.length; i++) {
                                        if (data.productImages[i]._id == req.query.imageId) {
                                                await productVarient.findOneAndUpdate({ _id: data._id, 'productImages._id': req.query.imageId }, { $pull: { 'productImages': { _id: req.query.imageId } } }, { new: true });
                                        }
                                }
                                const data1 = await productVarient.findById({ _id: req.params.id });
                                if (data1) {
                                        return res.status(200).send({ status: 200, message: "Image delete for varient successfully..", data: data1 });
                                }
                        }
                }
        } catch (error) {
                console.log("error", error)
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.getOrders = async (req, res, next) => {
        try {
                const orders = await order.find({ vendorId: req.user._id, orderStatus: "confirmed" }).populate("userId")
                        .populate("vendorId")
                        .populate("categoryId")
                        .populate("subcategoryId")
                        .populate("productId")
                        .populate({ path: "productVarientId", populate: [{ path: "color", model: "color" }] })
                        .populate("unitId");
                if (orders.length == 0) {
                        return res.status(404).json({ status: 404, message: "Orders not found", data: {} });
                }
                return res.status(200).json({ status: 200, msg: "orders of user", data: orders })
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.addKYC = async (req, res) => {
        try {
                const vendorData = await User.findOne({ _id: req.user._id });
                if (!vendorData) return res.status(404).json({ status: 404, message: "No data found", data: {} });
                const findKyc = await vendorKyc.findOne({ VendorId: vendorData._id });
                const kycFields = [
                        'passPort', 'socialSecurityCard', 'dL', 'voterIdentityCard', 'addressProof',
                ];
                const kycFiles = kycFields.reduce((acc, field) => {
                        if (req.files[field]) acc[field] = req.files[field][0].path;
                        return acc;
                }, {});
                if (findKyc) {
                        const result = await vendorKyc.findByIdAndUpdate({ _id: findKyc._id }, { $set: req.body, ...kycFiles }, { new: true });
                        if (result) {
                                const userData1 = await User.findByIdAndUpdate({ _id: vendorData._id }, { $set: { kycStatus: kycStatus.UPLOADED, kycDocumentId: result._id } }, { new: true });
                                const userData2 = await User.findById({ _id: userData1._id }).populate('kycDocumentId');
                                return res.status(200).json({ status: 200, msg: "KYC upload", data: userData2 });
                        }
                } else {
                        req.body.vendorId = vendorData._id;
                        const kycData = { ...req.body, ...kycFiles };
                        const result = await vendorKyc(kycData).save();
                        if (result) {
                                const userData1 = await User.findByIdAndUpdate({ _id: vendorData._id }, { $set: { kycStatus: kycStatus.UPLOADED, kycDocumentId: result._id } }, { new: true });
                                const userData2 = await User.findById({ _id: userData1._id }).populate('kycDocumentId');
                                return res.status(200).json({ status: 200, msg: "KYC upload", data: userData2 });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(501).send({ status: 501, message: "Server error.", data: {} });
        }
};
exports.KycList = async (req, res) => {
        try {
                const vendorData = await User.findOne({ _id: req.user._id, });
                if (!vendorData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let driverResult = await vendorKyc.findOne({ vendorId: vendorData._id })
                        if (!driverResult) {
                                return res.status(200).json({ status: 200, msg: "Kyc data fetch.", data: [] })
                        } else {
                                return res.status(200).json({ status: 200, msg: "Kyc data fetch.", data: driverResult })
                        }
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getcancelReturnOrder = async (req, res, next) => {
        try {
                const orders = await cancelReturnOrder.find({ vendorId: req.user._id }).populate('Orders');
                if (orders.length == 0) {
                        return res.status(404).json({ status: 404, message: "Orders not found", data: {} });
                }
                return res.status(200).json({ status: 200, msg: "orders of user", data: orders })
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.addOffer = async (req, res) => {
        try {
                if (req.body.userId != (null || undefined)) {
                        let vendorData = await User.findOne({ _id: req.body.userId });
                        if (!vendorData) {
                                return res.status(404).send({ status: 404, message: "User not found" });
                        }
                        const findProduct = await product.findById({ _id: req.body.productId });
                        if (!findProduct) {
                                return res.status(404).json({ message: "Product Not Found", status: 404, data: {} });
                        } else {
                                let fileUrl;
                                if (req.file) {
                                        fileUrl = req.file ? req.file.path : "";
                                }
                                const d = new Date(req.body.expirationDate);
                                let expirationDate = d.toISOString();
                                const de = new Date(req.body.activationDate);
                                let activationDate = de.toISOString();
                                let couponCode = await reffralCode();
                                let obj = {
                                        vendorId: req.user._id,
                                        userId: req.body.userId,
                                        productId: findProduct._id,
                                        couponCode: couponCode,
                                        amount: req.body.amount,
                                        expirationDate: expirationDate,
                                        activationDate: activationDate,
                                        image: fileUrl,
                                        type: "user",
                                        addBy: "Vendor"
                                }
                                let saveStore = await offer(obj).save();
                                if (saveStore) {
                                        res.json({ status: 200, message: 'offer add successfully.', data: saveStore });
                                }
                        }
                } else {
                        const findProduct = await product.findById({ _id: req.body.productId });
                        if (!findProduct) {
                                return res.status(404).json({ message: "Product Not Found", status: 404, data: {} });
                        } else {
                                let fileUrl;
                                if (req.file) {
                                        fileUrl = req.file ? req.file.path : "";
                                }
                                const d = new Date(req.body.expirationDate);
                                let expirationDate = d.toISOString();
                                const de = new Date(req.body.activationDate);
                                let activationDate = de.toISOString();
                                let couponCode = await reffralCode();
                                let obj = {
                                        vendorId: req.user._id,
                                        couponCode: couponCode,
                                        amount: req.body.amount,
                                        expirationDate: expirationDate,
                                        activationDate: activationDate,
                                        image: fileUrl,
                                        type: "other",
                                        addBy: "Vendor"
                                }
                                let saveStore = await offer(obj).save();
                                if (saveStore) {
                                        res.json({ status: 200, message: 'offer add successfully.', data: saveStore });
                                }
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.listOffer = async (req, res) => {
        try {
                let findService = await offer.find({ vendorId: req.user._id });
                if (findService.length == 0) {
                        return res.status(404).send({ status: 404, message: "Data not found" });
                } else {
                        return res.json({ status: 200, message: 'Offer Data found successfully.', service: findService });
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.dashboard = async (req, res, next) => {
        try {
                const findProduct = await product.find({ vendorId: req.user._id }).count()
                const findCategory = await Category.find({ vendorId: req.user._id }).count()
                const findOrder = await order.find({ vendorId: req.user._id }).count()
                let obj = {
                        product: findProduct,
                        category: findCategory,
                        order: findOrder,
                }
                return res.status(200).json({ status: 200, msg: "Get dashboard", data: obj })
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.changeOrderStatus = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).json({ status: 404, message: "User not found" });
                } else {
                        const orders = await order.findById({ _id: req.params.id })
                        if (!orders) {
                                return res.status(404).json({ status: 404, message: "Orders not found", data: {} });
                        }
                        let findUser = await order.findByIdAndUpdate({ _id: orders._id }, { $set: { orderStatus: req.body.orderStatus } }, { new: true });
                        return res.status(200).json({ message: "Reject return successfully.", status: 200, data: findUser });
                }
        } catch (error) {
                return res.status(500).send({ msg: "internal server error", error: error, });
        }
};
exports.addKYB = async (req, res) => {
        try {
                const vendorData = await User.findOne({ _id: req.user._id });
                if (!vendorData) return res.status(404).json({ status: 404, message: "No data found", data: {} });
                const findKyc = await vendorKyb.findOne({ VendorId: vendorData._id });
                const isUBOs = req.body.UBOs === "true";
                const isUsEIN = req.body.usEIN === "true";
                const kybFields = [
                        'certIncorRegi', 'excerptStateCompanyRegi', 'certIncorIncumbency', 'CertGoodStanding', 'memorandum',
                ];
                if (isUBOs) {
                        const uboFields = [
                                'uboShareholderRegi', 'uboStatOfInformation', 'uboExcerptStateCompanyRegi',
                                'uboCertIncorIncumbency', 'uboMemorandum', 'uboTrustAgreement',
                        ];
                        kybFields.push(...uboFields);
                }
                if (!isUsEIN) {
                        const uboFields = [
                                'evidence',
                        ];
                        kybFields.push(...uboFields);
                        console.log(kybFields);
                }
                const kybFiles = kybFields.reduce((acc, field) => {
                        if (req.files[field]) acc[field] = req.files[field][0].path;
                        return acc;
                }, {});

                if (findKyc) {
                        const result = await vendorKyb.findByIdAndUpdate({ _id: findKyc._id }, { $set: req.body, ...kybFiles }, { new: true });
                        if (result) {
                                const userData1 = await User.findByIdAndUpdate({ _id: vendorData._id }, { $set: { kybStatus: kycStatus.UPLOADED, kybDocumentId: result._id } }, { new: true });
                                const userData2 = await User.findById({ _id: userData1._id }).populate('kybDocumentId');
                                return res.status(200).json({ status: 200, msg: "KYB upload", data: userData2 });
                        }
                } else {
                        req.body.vendorId = vendorData._id;
                        const kybData = { ...req.body, ...kybFiles };
                        const result = await vendorKyb(kybData).save();
                        if (result) {
                                const userData1 = await User.findByIdAndUpdate({ _id: vendorData._id }, { $set: { kybStatus: kycStatus.UPLOADED, kybDocumentId: result._id } }, { new: true });
                                const userData2 = await User.findById({ _id: userData1._id }).populate('kybDocumentId');
                                return res.status(200).json({ status: 200, msg: "KYB upload", data: userData2 });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(501).send({ status: 501, message: "Server error.", data: {} });
        }
};
exports.KybList = async (req, res) => {
        try {
                const vendorData = await User.findOne({ _id: req.user._id, });
                if (!vendorData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let driverResult = await vendorKyb.findOne({ vendorId: vendorData._id });
                        if (!driverResult) {
                                return res.status(200).json({ status: 200, msg: "Kyc data fetch.", data: [] })
                        } else {
                                return res.status(200).json({ status: 200, msg: "Kyc data fetch.", data: driverResult })
                        }
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
const reffralCode = async () => {
        var digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let OTP = '';
        for (let i = 0; i < 9; i++) {
                OTP += digits[Math.floor(Math.random() * 36)];
        }
        return OTP;
}