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
exports.registration = async (req, res) => {
        try {
                const { phone } = req.body;
                const user = await User.findOne({ phone: phone, userType: userType.VENDOR });
                if (!user) {
                        req.body.otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                        req.body.otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                        req.body.accountVerification = false;
                        req.body.userType = userType.VENDOR;
                        req.body.booking = 3;
                        const userCreate = await User.create(req.body);
                        let obj = {
                                id: userCreate._id,
                                otp: userCreate.otp,
                                phone: userCreate.phone
                        }
                        return res.status(200).send({ status: 200, message: "Registered successfully ", data: obj, });
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
                const user = await User.findById({ _id: req.params.id, userType: userType.VENDOR });
                if (!user) {
                        return res.status(404).send({ message: "user not found" });
                }
                if (user.otp !== otp || user.otpExpiration < Date.now()) {
                        return res.status(400).json({ message: "Invalid OTP" });
                }
                const updated = await User.findByIdAndUpdate({ _id: user._id }, { accountVerification: true }, { new: true });
                const accessToken = await jwt.sign({ id: user._id }, authConfig.secret, {
                        expiresIn: authConfig.accessTokenTime,
                });
                let obj = {
                        id: updated._id,
                        otp: updated.otp,
                        phone: updated.phone,
                        accessToken: accessToken
                }
                return res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({ error: "internal server error" + err.message });
        }
};
exports.loginWithPhone = async (req, res) => {
        try {
                const { phone } = req.body;
                const user = await User.findOne({ phone: phone, userType: userType.VENDOR });
                if (!user) {
                        return res.status(400).send({ msg: "not found" });
                }
                const userObj = {};
                userObj.otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                userObj.otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                userObj.accountVerification = false;
                const updated = await User.findOneAndUpdate({ phone: phone, userType: userType.VENDOR }, userObj, { new: true, });
                let obj = { id: updated._id, otp: updated.otp, phone: updated.phone }
                return res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
        } catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Server error" });
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
                const { firstName, lastName, email, phone } = req.body;
                console.log(req.body);
                const user = await User.findOne({ $and: [{ $or: [{ email }, { phone }] }, { userType: userType.VENDOR }] });
                if (user) {
                        jwt.sign({ id: user._id }, authConfig.secret, (err, token) => {
                                if (err) {
                                        return res.status(401).send("Invalid Credentials");
                                } else {
                                        return res.status(200).json({ status: 200, msg: "Login successfully", userId: user._id, token: token, });
                                }
                        });
                } else {
                        let refferalCode = await reffralCode();
                        const newUser = await User.create({ firstName, lastName, phone, email, refferalCode, userType: userType.VENDOR });
                        if (newUser) {
                                jwt.sign({ id: newUser._id }, authConfig.secret, (err, token) => {
                                        if (err) {
                                                return res.status(401).send("Invalid Credentials");
                                        } else {
                                                console.log(token);
                                                return res.status(200).json({ status: 200, msg: "Login successfully", userId: newUser._id, token: token, });
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
                const user = await User.findOne({ email: email, userType: userType.VENDOR });
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
        const { email } = req.params;
        try {
                const user = await User.findOne({ email: email });
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
                const { email, password } = req.body;
                const user = await User.findOne({ email: email, userType: userType.VENDOR });
                if (!user) {
                        return res.status(404).send({ message: "user not found ! not registered" });
                }
                const isValidPassword = bcrypt.compareSync(password, user.password);
                if (!isValidPassword) {
                        return res.status(401).send({ message: "Wrong password" });
                }
                const accessToken = jwt.sign({ id: user._id }, authConfig.secret, { expiresIn: authConfig.accessTokenTime, });
                return res.status(201).send({ message: "Sign in successfully", data: user, accessToken: accessToken });
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
                                        let productImage = [], discountPrice, varient, size, viewOnwebsite;
                                        if (req.files) {
                                                for (let i = 0; i < req.files.length; i++) {
                                                        productImage.push(req.files[i].path);
                                                }
                                        }
                                        if (req.body.discountActive == "true") {
                                                discountPrice = req.body.originalPrice - ((req.body.originalPrice * req.body.discount) / 100)
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
                                                }
                                        }
                                        let obj = {
                                                vendorId: vendorResult._id,
                                                categoryId: findCategory._id,
                                                subcategoryId: findSubCategory._id,
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

