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
const cart = require('../models/cart');
const order = require("../models/order/orderModel");
const userOrders = require("../models/order/userOrders");
const transactionModel = require("../models/transactionModel");
const cancelReturnOrder = require("../models/order/cancelReturnOrder");

exports.forgetPassword = async (req, res) => {
        try {
                const data = await User.findOne({ email: req.body.email });
                if (!data) {
                        return res.status(400).send({ msg: "not found" });
                } else {
                        let otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                        let accountVerification = false;
                        let otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                        const updated = await User.findOneAndUpdate({ _id: data._id }, { $set: { accountVerification: accountVerification, otp: otp, otpExpiration: otpExpiration } }, { new: true, });
                        if (updated) {
                                return res.status(200).json({ message: "Otp send to your email.", status: 200, data: {} });
                        }
                }
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.changePassword = async (req, res) => {
        try {
                const user = await User.findOne({ email: req.body.email });
                if (user) {
                        if (user.otp !== req.body.otp || user.otpExpiration < Date.now()) {
                                return res.status(400).json({ message: "Invalid OTP" });
                        }
                        if (req.body.newPassword == req.body.confirmPassword) {
                                const updated = await User.findOneAndUpdate({ _id: user._id }, { $set: { password: bcrypt.hashSync(req.body.newPassword), accountVerification: true } }, { new: true });
                                return res.status(200).send({ message: "Password update successfully.", data: updated, });
                        } else {
                                return res.status(501).send({ message: "Password Not matched.", data: {}, });
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getCategories = async (req, res) => {
        const categories = await Category.find({ gender: req.params.gender });
        if (categories.length == 0) {
                return res.status(200).json({ status: 200, message: "Category data found.", data: [] });
        }
        return res.status(200).json({ status: 200, message: "Category data found.", data: categories });
};
exports.getSubCategoryByCategoryId = async (req, res) => {
        try {
                const data = await subCategory.find({ categoryId: req.params.categoryId });
                if (!data || data.length === 0) {
                        return res.status(200).json({ status: 200, message: "Sub Category data found.", data: [] });
                }
                return res.status(200).json({ status: 200, message: "Sub Category data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.listProduct = async (req, res) => {
        try {
                let query = {};
                if (req.query.categoryId) {
                        query.categoryId = req.query.categoryId;
                }
                if (req.query.subcategoryId) {
                        query.subcategoryId = req.query.subcategoryId;
                }
                if (req.query.gender) {
                        query.gender = req.query.gender;
                }
                if (req.query.fromDate && !req.query.toDate) {
                        query.createdAt = { $gte: req.query.fromDate };
                }
                if (!req.query.fromDate && req.query.toDate) {
                        query.createdAt = { $lte: req.query.toDate };
                }
                if (req.query.fromDate && req.query.toDate) {
                        query.$and = [
                                { createdAt: { $gte: req.query.fromDate } },
                                { createdAt: { $lte: req.query.toDate } },
                        ];
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
                                return res.status(200).send({ status: 200, message: "Product data found successfully.", data: [] });
                        } else {
                                return res.status(200).send({ status: 200, message: "Product data found successfully.", data: transRes });
                        }
                })

        } catch (error) {
                console.log(error)
                return res.status(500).send({ message: "Internal Server error" + error.message });
        }
};
exports.listProductVarient = async (req, res) => {
        try {
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
        } catch (error) {
                return res.status(500).send({ message: "Internal Server error" + error.message });
        }
};
exports.addtocart = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id, userType: userType.USER });
                if (!userData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findCart = await cart.findOne({ userId: userData._id });
                        if (findCart) {
                                let findProduct = await product.findById({ _id: req.body.productId });
                                if (!findProduct) {
                                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                } else {
                                        if (findProduct.varient == true) {
                                                let findVarient = await productVarient.findById({ _id: req.body.varientId });
                                                if (findVarient) {
                                                        if (findVarient.size == true) {
                                                                const found = await findCart.products.some(el => ((el.productVarientId).toString() === (findVarient._id).toString()) && ((el.unitId).toString() == (req.body.colorsUnitId).toString()));
                                                                if (!found) {
                                                                        console.log("103=============================");
                                                                        for (let i = 0; i < findVarient.colorsUnits.length; i++) {
                                                                                if ((findVarient.colorsUnits[i].unitId).toString() == req.body.colorsUnitId) {
                                                                                        let price = 0;
                                                                                        if (findProduct.discountActive == true) {
                                                                                                price = findProduct.discountPrice;
                                                                                        } else {
                                                                                                price = findProduct.originalPrice;
                                                                                        }
                                                                                        let obj = {
                                                                                                vendorId: findProduct.vendorId,
                                                                                                categoryId: findProduct.categoryId,
                                                                                                subcategoryId: findProduct.subcategoryId,
                                                                                                productId: findProduct._id,
                                                                                                productVarientId: findVarient._id,
                                                                                                unitId: req.body.colorsUnitId,
                                                                                                unitInwords: findVarient.colorsUnits[i].unitInwords,
                                                                                                productPrice: price,
                                                                                                quantity: req.body.quantity,
                                                                                                total: price * req.body.quantity,
                                                                                        }
                                                                                        let updateCart = await cart.findOneAndUpdate({ _id: findCart._id }, { $push: { products: obj } }, { new: true });
                                                                                        if (updateCart) {
                                                                                                let totalAmount = 0;
                                                                                                let totalItem = updateCart.products.length;
                                                                                                for (let l = 0; l < updateCart.products.length; l++) {
                                                                                                        totalAmount = totalAmount + updateCart.products[l].total;
                                                                                                }
                                                                                                let b = await cart.findByIdAndUpdate({ _id: updateCart._id }, { $set: { totalAmount: totalAmount, totalItem: totalItem } }, { new: true })
                                                                                                return res.status(200).send({ message: "Product add to cart.", data: b, });
                                                                                        }
                                                                                }
                                                                        }
                                                                }
                                                                // done
                                                                else {
                                                                        console.log("133=============================");
                                                                        for (let k = 0; k < findVarient.colorsUnits.length; k++) {
                                                                                if ((findVarient.colorsUnits[k].unitId).toString() == req.body.colorsUnitId) {
                                                                                        let price = 0;
                                                                                        if (findProduct.discountActive == true) {
                                                                                                price = findProduct.discountPrice;
                                                                                        } else {
                                                                                                price = findProduct.originalPrice;
                                                                                        }
                                                                                        let total = price * req.body.quantity;
                                                                                        let quantity = req.body.quantity;
                                                                                        let updateCart = await cart.findOneAndUpdate({ userId: userData._id, 'products.productVarientId': req.body.varientId, 'products.unitId': req.body.colorsUnitId }, { $set: { 'products.$.productPrice': price, 'products.$.quantity': quantity, 'products.$.total': total, 'products.$.productVarientId': findVarient._id } }, { new: true });
                                                                                        if (updateCart) {
                                                                                                let totalAmount = 0;
                                                                                                let totalItem = updateCart.products.length;
                                                                                                for (let l = 0; l < updateCart.products.length; l++) {
                                                                                                        totalAmount = totalAmount + updateCart.products[l].total;
                                                                                                }
                                                                                                let b = await cart.findByIdAndUpdate({ _id: updateCart._id }, { $set: { totalAmount: totalAmount, totalItem: totalItem } }, { new: true })
                                                                                                return res.status(200).send({ message: "Product add to cart.", data: b, });
                                                                                        }
                                                                                }
                                                                        }
                                                                }
                                                        } else {
                                                                console.log("kkkkkkkkkkkkk");
                                                                const found = findCart.products.some(el => ((el.productId).toString() === (findProduct._id).toString()));
                                                                if (!found) {
                                                                        let price = 0;
                                                                        if (findProduct.discountActive == true) {
                                                                                price = findProduct.discountPrice;
                                                                        } else {
                                                                                price = findProduct.originalPrice;
                                                                        }
                                                                        let obj = {
                                                                                vendorId: findProduct.vendorId,
                                                                                categoryId: findProduct.categoryId,
                                                                                subcategoryId: findProduct.subcategoryId,
                                                                                productId: findProduct._id,
                                                                                productVarientId: findVarient._id,
                                                                                unitId: findVarient.unitId,
                                                                                unitInwords: findVarient.unitInwords,
                                                                                productPrice: price,
                                                                                quantity: req.body.quantity,
                                                                                total: price * req.body.quantity,
                                                                        }
                                                                        let updateCart = await cart.findOneAndUpdate({ _id: findCart._id }, { $push: { products: obj } }, { new: true });
                                                                        if (updateCart) {
                                                                                let totalAmount = 0;
                                                                                let totalItem = updateCart.products.length;
                                                                                for (let l = 0; l < updateCart.products.length; l++) {
                                                                                        totalAmount = totalAmount + updateCart.products[l].total;
                                                                                }
                                                                                let b = await cart.findByIdAndUpdate({ _id: updateCart._id }, { $set: { totalAmount: totalAmount, totalItem: totalItem } }, { new: true })
                                                                                return res.status(200).send({ message: "Product add to cart.", data: b, });
                                                                        }
                                                                } else {
                                                                        let price = 0;
                                                                        if (findProduct.discountActive == true) {
                                                                                price = findProduct.discountPrice;
                                                                        } else {
                                                                                price = findProduct.originalPrice;
                                                                        }
                                                                        let total = price * req.body.quantity;
                                                                        let quantity = req.body.quantity;
                                                                        let updateCart = await cart.findOneAndUpdate({ userId: userData._id, 'products.productId': req.body.productId, 'products.unitId': findVarient.unitId }, { $set: { 'products.$.productPrice': price, 'products.$.quantity': quantity, 'products.$.total': total } }, { new: true });
                                                                        if (updateCart) {
                                                                                let totalAmount = 0;
                                                                                let totalItem = updateCart.products.length;
                                                                                for (let l = 0; l < updateCart.products.length; l++) {
                                                                                        totalAmount = totalAmount + updateCart.products[l].total;
                                                                                }
                                                                                let b = await cart.findByIdAndUpdate({ _id: updateCart._id }, { $set: { totalAmount: totalAmount, totalItem: totalItem } }, { new: true })
                                                                                return res.status(200).send({ message: "Product add to cart.", data: b, });
                                                                        }
                                                                }
                                                        }
                                                }
                                                // done
                                                else {
                                                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                                }
                                        }
                                        // done
                                        else {
                                                // done
                                                if (findProduct.size == true) {
                                                        console.log("185--------------------");
                                                        let findVarient = await productVarient.findById({ _id: req.body.varientId });
                                                        if (findVarient) {
                                                                const found = findCart.products.some(el => ((el.productVarientId).toString() === (findVarient._id).toString()) && ((el.unitId).toString() == (req.body.colorsUnitId).toString()));
                                                                if (!found) {
                                                                        console.log("190--------------------------");
                                                                        let price = 0;
                                                                        if (findProduct.discountActive == true) {
                                                                                price = findProduct.discountPrice;
                                                                        } else {
                                                                                price = findProduct.originalPrice;
                                                                        }
                                                                        let obj = {
                                                                                vendorId: findProduct.vendorId,
                                                                                categoryId: findProduct.categoryId,
                                                                                subcategoryId: findProduct.subcategoryId,
                                                                                productId: findProduct._id,
                                                                                productVarientId: findVarient._id,
                                                                                unitId: findVarient.unitId,
                                                                                unitInwords: findVarient.unitInwords,
                                                                                productPrice: price,
                                                                                quantity: req.body.quantity,
                                                                                total: price * req.body.quantity,
                                                                        }
                                                                        let updateCart = await cart.findOneAndUpdate({ _id: findCart._id }, { $push: { products: obj } }, { new: true });
                                                                        if (updateCart) {
                                                                                let totalAmount = 0;
                                                                                let totalItem = updateCart.products.length;
                                                                                for (let l = 0; l < updateCart.products.length; l++) {
                                                                                        totalAmount = totalAmount + updateCart.products[l].total;
                                                                                }
                                                                                let b = await cart.findByIdAndUpdate({ _id: updateCart._id }, { $set: { totalAmount: totalAmount, totalItem: totalItem } }, { new: true })
                                                                                return res.status(200).send({ message: "Product add to cart.", data: b, });
                                                                        }
                                                                } else {
                                                                        if ((findVarient.unitId).toString() == req.body.colorsUnitId) {
                                                                                let price = 0;
                                                                                if (findProduct.discountActive == true) {
                                                                                        price = findProduct.discountPrice;
                                                                                } else {
                                                                                        price = findProduct.originalPrice;
                                                                                }
                                                                                let total = price * req.body.quantity;
                                                                                let quantity = req.body.quantity;
                                                                                let updateCart = await cart.findOneAndUpdate({ userId: userData._id, 'products.productVarientId': req.body.varientId, 'products.unitId': req.body.colorsUnitId }, { $set: { 'products.$.productPrice': price, 'products.$.quantity': quantity, 'products.$.total': total, 'products.$.productVarientId': findVarient._id } }, { new: true });
                                                                                if (updateCart) {
                                                                                        let totalAmount = 0;
                                                                                        let totalItem = updateCart.products.length;
                                                                                        for (let l = 0; l < updateCart.products.length; l++) {
                                                                                                totalAmount = totalAmount + updateCart.products[l].total;
                                                                                        }
                                                                                        let b = await cart.findByIdAndUpdate({ _id: updateCart._id }, { $set: { totalAmount: totalAmount, totalItem: totalItem } }, { new: true })
                                                                                        return res.status(200).send({ message: "Product add to cart.", data: b, });
                                                                                }
                                                                        }
                                                                }
                                                        } else {
                                                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                                        }
                                                } else {
                                                        console.log("198--------------------");
                                                        const found = findCart.products.some(el => ((el.productId).toString() === (findProduct._id).toString()));
                                                        if (!found) {
                                                                let price = 0;
                                                                if (findProduct.discountActive == true) {
                                                                        price = findProduct.discountPrice;
                                                                } else {
                                                                        price = findProduct.originalPrice;
                                                                }
                                                                let obj = {
                                                                        vendorId: findProduct.vendorId,
                                                                        categoryId: findProduct.categoryId,
                                                                        subcategoryId: findProduct.subcategoryId,
                                                                        productId: findProduct._id,
                                                                        productPrice: price,
                                                                        quantity: req.body.quantity,
                                                                        total: price * req.body.quantity,
                                                                }
                                                                let updateCart = await cart.findOneAndUpdate({ _id: findCart._id }, { $push: { products: obj } }, { new: true });
                                                                if (updateCart) {
                                                                        let totalAmount = 0;
                                                                        let totalItem = updateCart.products.length;
                                                                        for (let l = 0; l < updateCart.products.length; l++) {
                                                                                totalAmount = totalAmount + updateCart.products[l].total;
                                                                        }
                                                                        let b = await cart.findByIdAndUpdate({ _id: updateCart._id }, { $set: { totalAmount: totalAmount, totalItem: totalItem } }, { new: true })
                                                                        return res.status(200).send({ message: "Product add to cart.", data: b, });
                                                                }
                                                        } else {
                                                                let price = 0;
                                                                if (findProduct.discountActive == true) {
                                                                        price = findProduct.discountPrice;
                                                                } else {
                                                                        price = findProduct.originalPrice;
                                                                }
                                                                let total = price * req.body.quantity;
                                                                let quantity = req.body.quantity;
                                                                let updateCart = await cart.findOneAndUpdate({ userId: userData._id, 'products.productId': req.body.productId }, { $set: { 'products.$.productPrice': price, 'products.$.quantity': quantity, 'products.$.total': total } }, { new: true });
                                                                if (updateCart) {
                                                                        let totalAmount = 0;
                                                                        let totalItem = updateCart.products.length;
                                                                        for (let l = 0; l < updateCart.products.length; l++) {
                                                                                totalAmount = totalAmount + updateCart.products[l].total;
                                                                        }
                                                                        let b = await cart.findByIdAndUpdate({ _id: updateCart._id }, { $set: { totalAmount: totalAmount, totalItem: totalItem } }, { new: true })
                                                                        return res.status(200).send({ message: "Product add to cart.", data: b, });
                                                                }
                                                        }
                                                }
                                        }
                                }
                        } else {
                                let findProduct = await product.findById({ _id: req.body.productId });
                                if (!findProduct) {
                                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                } else {
                                        if (findProduct.varient == true) {
                                                let findVarient = await productVarient.findById({ _id: req.body.varientId });
                                                if (findVarient) {
                                                        if (findVarient.size == true) {
                                                                for (let i = 0; i < findVarient.colorsUnits.length; i++) {
                                                                        if ((findVarient.colorsUnits[i].unitId).toString() == req.body.colorsUnitId) {
                                                                                let price = 0;
                                                                                if (findProduct.discountActive == true) {
                                                                                        price = findProduct.discountPrice;
                                                                                } else {
                                                                                        price = findProduct.originalPrice;
                                                                                }
                                                                                let obj = {
                                                                                        userId: userData._id,
                                                                                        categoryId: findProduct.categoryId,
                                                                                        products: [{
                                                                                                vendorId: findProduct.vendorId,
                                                                                                categoryId: findProduct.categoryId,
                                                                                                subcategoryId: findProduct.subcategoryId,
                                                                                                productId: findProduct._id,
                                                                                                productVarientId: findVarient._id,
                                                                                                unitId: req.body.colorsUnitId,
                                                                                                unitInwords: findVarient.colorsUnits[i].unitInwords,
                                                                                                productPrice: price,
                                                                                                quantity: req.body.quantity,
                                                                                                total: price * req.body.quantity,
                                                                                        }],
                                                                                        totalAmount: price * req.body.quantity,
                                                                                        totalItem: 1,
                                                                                }
                                                                                let updateCart = await cart(obj).save()
                                                                                if (updateCart) {
                                                                                        return res.status(200).send({ message: "Product add to cart.", data: updateCart, });
                                                                                }
                                                                        }
                                                                }
                                                        } else {
                                                                let price = 0;
                                                                if (findProduct.discountActive == true) {
                                                                        price = findProduct.discountPrice;
                                                                } else {
                                                                        price = findProduct.originalPrice;
                                                                }
                                                                let obj = {
                                                                        userId: userData._id,
                                                                        categoryId: findProduct.categoryId,
                                                                        products: [{
                                                                                vendorId: findProduct.vendorId,
                                                                                categoryId: findProduct.categoryId,
                                                                                subcategoryId: findProduct.subcategoryId,
                                                                                productId: findProduct._id,
                                                                                productVarientId: findVarient._id,
                                                                                unitId: findVarient.unitId,
                                                                                unitInwords: findVarient.unitInwords,
                                                                                productPrice: price,
                                                                                quantity: req.body.quantity,
                                                                                total: price * req.body.quantity,
                                                                        }],
                                                                        totalAmount: price * req.body.quantity,
                                                                        totalItem: 1,
                                                                }
                                                                let updateCart = await cart(obj).save()
                                                                if (updateCart) {
                                                                        return res.status(200).send({ message: "Product add to cart.", data: updateCart, });
                                                                }
                                                        }
                                                } else {
                                                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                                }
                                        } else {
                                                //done
                                                if (findProduct.size == true) {
                                                        console.log("196--------------------");
                                                        let findVarient = await productVarient.findById({ _id: req.body.varientId });
                                                        if (findVarient) {
                                                                let price = 0;
                                                                if (findProduct.discountActive == true) {
                                                                        price = findProduct.discountPrice;
                                                                } else {
                                                                        price = findProduct.originalPrice;
                                                                }
                                                                let obj = {
                                                                        userId: userData._id,
                                                                        products: [{
                                                                                vendorId: findProduct.vendorId,
                                                                                categoryId: findProduct.categoryId,
                                                                                subcategoryId: findProduct.subcategoryId,
                                                                                productId: findProduct._id,
                                                                                productVarientId: findVarient._id,
                                                                                unitId: findVarient.unitId,
                                                                                unitInwords: findVarient.unitInwords,
                                                                                productPrice: price,
                                                                                quantity: req.body.quantity,
                                                                                total: price * req.body.quantity,
                                                                        }],
                                                                        totalAmount: price * req.body.quantity,
                                                                        totalItem: 1,
                                                                }
                                                                const cartCreate = await cart.create(obj);
                                                                return res.status(200).send({ message: "Product add to cart.", data: cartCreate, });
                                                        } else {
                                                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                                        }
                                                } else {
                                                        console.log("198--------------------");
                                                        let price = 0;
                                                        if (findProduct.discountActive == true) {
                                                                price = findProduct.discountPrice;
                                                        } else {
                                                                price = findProduct.originalPrice;
                                                        }
                                                        let obj = {
                                                                userId: userData._id,
                                                                products: [{
                                                                        vendorId: findProduct.vendorId,
                                                                        categoryId: findProduct.categoryId,
                                                                        subcategoryId: findProduct.subcategoryId,
                                                                        productId: findProduct._id,
                                                                        productPrice: price,
                                                                        quantity: req.body.quantity,
                                                                        total: price * req.body.quantity,
                                                                }],
                                                                totalAmount: price * req.body.quantity,
                                                                totalItem: 1,
                                                        }
                                                        const cartCreate = await cart.create(obj);
                                                        return res.status(200).send({ message: "Product add to cart.", data: cartCreate, });
                                                }
                                        }
                                }
                        }
                }
        } catch (error) {
                console.log(error)
                return res.status(500).send({ message: "Internal Server error" + error.message });
        }
};
exports.getCart = async (req, res) => {
        try {
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found or token expired." });
                } else {
                        let findCart = await cart.findOne({ userId: user._id }).populate("userId")
                                .populate("products.vendorId")
                                .populate("products.categoryId")
                                .populate("products.subcategoryId")
                                .populate("products.productId")
                                .populate({ path: "products.productVarientId", populate: [{ path: "color", model: "color" }] })
                                .populate("products.unitId")
                        if (findCart) {
                                return res.status(200).send({ status: 200, message: "Cart detail found.", data: findCart });
                        } else {
                                return res.status(200).send({ status: 200, message: "Cart detail not found.", data: {} });
                        }
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.deletecartItem = async (req, res) => {
        try {
                const userData = await User.findById(req.user._id);
                if (!userData) {
                        return res.status(404).send({ status: 404, message: "User not found or token expired." });
                } else {
                        let findCart = await cart.findOne({ userId: userData._id });
                        if (findCart) {
                                for (let i = 0; i < findCart.products.length; i++) {
                                        if (findCart.products.length > 1) {
                                                if (((findCart.products[i]._id).toString() == req.params.id) == true) {
                                                        let updateCart = await cart.findByIdAndUpdate({ _id: findCart._id, 'products._id': req.params.id }, { $pull: { 'products': { _id: req.params.id, vendorId: findCart.products[i].vendorId, categoryId: findCart.products[i].categoryId, subcategoryId: findCart.products[i].subcategoryId, productId: findCart.products[i].productId, productVarientId: findCart.products[i].productVarientId, unitId: findCart.products[i].unitId, unitInwords: findCart.products[i].unitInwords, productPrice: findCart.products[i].productPrice, quantity: findCart.products[i].quantity, total: findCart.products[i].total, } } }, { new: true })
                                                        if (updateCart) {
                                                                let totalAmount = 0;
                                                                let totalItem = updateCart.products.length;
                                                                for (let l = 0; l < updateCart.products.length; l++) {
                                                                        totalAmount = totalAmount + updateCart.products[l].total;
                                                                }
                                                                let b = await cart.findByIdAndUpdate({ _id: updateCart._id }, { $set: { totalAmount: totalAmount, totalItem: totalItem } }, { new: true })
                                                                return res.status(200).send({ message: "Product delete from cart.", data: b, });
                                                        }
                                                }
                                        } else {
                                                let updateProject = await cart.findByIdAndDelete({ _id: findCart._id });
                                                if (updateProject) {
                                                        let findCart1 = await cart.findOne({ userId: userData._id });
                                                        if (!findCart1) {
                                                                return res.status(200).send({ status: 200, message: "Cart detail not found.", data: {} });
                                                        }
                                                }
                                        }
                                }
                        } else {
                                return res.status(200).send({ status: 200, message: "Cart detail not found.", data: {} });
                        }
                }
        } catch (error) {
                console.log("353====================>", error)
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.deleteCart = async (req, res) => {
        try {
                const userData = await User.findById(req.user._id);
                if (!userData) {
                        return res.status(404).send({ status: 404, message: "User not found or token expired." });
                } else {
                        let findCart = await cart.findOne({ userId: userData._id });
                        if (!findCart) {
                                return res.status(200).send({ status: 200, message: "Cart detail not found.", data: {} });
                        } else {
                                let update = await cart.findByIdAndDelete({ _id: findCart._id });
                                if (update) {
                                        return res.status(200).send({ status: 200, message: "Cart detail not found.", data: {} });
                                }
                        }
                }
        } catch (error) {
                console.log("380====================>", error)
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.addAdressToCart = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findCart = await cart.findOne({ userId: userData._id })
                        if (!findCart) {
                                return res.status(404).json({ status: 404, message: "Cart is empty.", data: {} });
                        } else {
                                if (findCart.products.length == 0) {
                                        return res.status(404).json({ status: 404, message: "First add product in your cart.", data: {} });
                                } else {
                                        let update1 = await cart.findByIdAndUpdate({ _id: findCart._id }, { $set: req.body }, { new: true });
                                        return res.status(200).json({ status: 200, message: "Address add to cart Successfully.", data: update1 })
                                }
                        }
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.changePaymentOption = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findCart = await cart.findOne({ userId: userData._id })
                        if (!findCart) {
                                return res.status(404).json({ status: 404, message: "Cart is empty.", data: {} });
                        } else {
                                if (findCart.products.length == 0) {
                                        return res.status(404).json({ status: 404, message: "First add product in your cart.", data: {} });
                                } else {
                                        let update1 = await cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { paymentOption: req.body.paymentOption } }, { new: true });
                                        return res.status(200).json({ status: 200, message: "Address add to cart Successfully.", data: update1 })
                                }
                        }
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.checkout = async (req, res) => {
        try {
                console.log(req.user._id);
                let findOrder = await userOrders.find({ user: req.user._id, orderStatus: "unconfirmed" });
                if (findOrder.length == 0) {
                        let findCart = await cart.findOne({ userId: req.user._id });
                        if (findCart) {
                                let orderId = await reffralCode(), orderStatus;
                                if (findCart.paymentOption == "PrePaid") {
                                        orderStatus = "unconfirmed"
                                } else {
                                        orderStatus = "confirmed"
                                }
                                for (let i = 0; i < findCart.products.length; i++) {
                                        let obj = {
                                                orderId: orderId,
                                                userId: findCart.userId,
                                                vendorId: findCart.products[i].vendorId,
                                                categoryId: findCart.products[i].categoryId,
                                                subcategoryId: findCart.products[i].subcategoryId,
                                                productId: findCart.products[i].productId,
                                                productVarientId: findCart.products[i].productVarientId,
                                                unitId: findCart.products[i].unitId,
                                                unitInwords: findCart.products[i].unitInwords,
                                                productPrice: findCart.products[i].productPrice,
                                                quantity: findCart.products[i].quantity,
                                                total: findCart.products[i].total,
                                                email: findCart.email,
                                                firstName: findCart.firstName,
                                                lastName: findCart.lastName,
                                                phone: findCart.phone,
                                                address: findCart.address,
                                                pincode: findCart.pincode,
                                                city: findCart.city,
                                                state: findCart.state,
                                                country: findCart.country,
                                                extimatedDelivery: findCart.extimatedDelivery,
                                                paymentOption: findCart.paymentOption,
                                                orderStatus: orderStatus
                                        }
                                        const Data = await order.create(obj);
                                        if (Data) {
                                                let findUserOrder = await userOrders.findOne({ orderId: orderId });
                                                if (findUserOrder) {
                                                        await userOrders.findByIdAndUpdate({ _id: findUserOrder._id }, { $push: { Orders: Data._id } }, { new: true });
                                                } else {
                                                        let Orders = [];
                                                        Orders.push(Data._id)
                                                        let obj1 = {
                                                                userId: findCart.userId,
                                                                orderId: orderId,
                                                                Orders: Orders,
                                                                email: findCart.email,
                                                                firstName: findCart.firstName,
                                                                lastName: findCart.lastName,
                                                                phone: findCart.phone,
                                                                address: findCart.address,
                                                                pincode: findCart.pincode,
                                                                city: findCart.city,
                                                                state: findCart.state,
                                                                country: findCart.country,
                                                                extimatedDelivery: findCart.extimatedDelivery,
                                                                totalAmount: findCart.totalAmount,
                                                                totalItem: findCart.totalItem,
                                                                paymentOption: findCart.paymentOption,
                                                                orderStatus: orderStatus
                                                        };
                                                        await userOrders.create(obj1);
                                                }
                                        }
                                }
                                let findUserOrder = await userOrders.findOne({ orderId: orderId }).populate('Orders');
                                return res.status(200).json({ status: 200, message: "Order create successfully. ", data: findUserOrder })
                        }
                } else {
                        for (let i = 0; i < findOrder.length; i++) {
                                await userOrders.findOneAndDelete({ orderId: findOrder[i].orderId });
                                let findOrders = await order.find({ orderId: findOrder[i].orderId });
                                if (findOrders.length > 0) {
                                        for (let j = 0; j < findOrders.length; j++) {
                                                await order.findByIdAndDelete({ _id: findOrders[j]._id });
                                        }
                                }
                        }
                        let findCart = await cart.findOne({ userId: req.user._id });
                        if (findCart) {
                                let orderId = await reffralCode(), orderStatus;
                                if (findCart.paymentOption == "PrePaid") {
                                        orderStatus = "unconfirmed"
                                } else {
                                        orderStatus = "confirmed"
                                }
                                for (let i = 0; i < findCart.products.length; i++) {
                                        let obj = {
                                                orderId: orderId,
                                                userId: findCart.userId,
                                                vendorId: findCart.products[i].vendorId,
                                                categoryId: findCart.products[i].categoryId,
                                                subcategoryId: findCart.products[i].subcategoryId,
                                                productId: findCart.products[i].productId,
                                                productVarientId: findCart.products[i].productVarientId,
                                                unitId: findCart.products[i].unitId,
                                                unitInwords: findCart.products[i].unitInwords,
                                                productPrice: findCart.products[i].productPrice,
                                                quantity: findCart.products[i].quantity,
                                                total: findCart.products[i].total,
                                                email: findCart.email,
                                                firstName: findCart.firstName,
                                                lastName: findCart.lastName,
                                                phone: findCart.phone,
                                                address: findCart.address,
                                                pincode: findCart.pincode,
                                                city: findCart.city,
                                                state: findCart.state,
                                                country: findCart.country,
                                                extimatedDelivery: findCart.extimatedDelivery,
                                                paymentOption: findCart.paymentOption,
                                                orderStatus: orderStatus
                                        }
                                        const Data = await order.create(obj);
                                        if (Data) {
                                                let findUserOrder = await userOrders.findOne({ orderId: orderId });
                                                if (findUserOrder) {
                                                        await userOrders.findByIdAndUpdate({ _id: findUserOrder._id }, { $push: { Orders: Data._id } }, { new: true });
                                                } else {
                                                        let Orders = [];
                                                        Orders.push(Data._id)
                                                        let obj1 = {
                                                                userId: findCart.userId,
                                                                orderId: orderId,
                                                                Orders: Orders,
                                                                email: findCart.email,
                                                                firstName: findCart.firstName,
                                                                lastName: findCart.lastName,
                                                                phone: findCart.phone,
                                                                address: findCart.address,
                                                                pincode: findCart.pincode,
                                                                city: findCart.city,
                                                                state: findCart.state,
                                                                country: findCart.country,
                                                                extimatedDelivery: findCart.extimatedDelivery,
                                                                totalAmount: findCart.totalAmount,
                                                                totalItem: findCart.totalItem,
                                                                paymentOption: findCart.paymentOption,
                                                                orderStatus: orderStatus
                                                        };
                                                        await userOrders.create(obj1);
                                                }
                                        }
                                }
                                let findUserOrder = await userOrders.findOne({ orderId: orderId }).populate('Orders');
                                return res.status(200).json({ status: 200, message: "Order create successfully. ", data: findUserOrder })
                        }
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.placeOrder = async (req, res) => {
        try {
                let findUserOrder = await userOrders.findOne({ orderId: req.params.orderId });
                if (findUserOrder) {
                        let line_items = [];
                        for (let i = 0; i < findUserOrder.Orders.length; i++) {
                                let findu = await order.findOne({ _id: findUserOrder.Orders[i] });
                                if (findu) {
                                        let findProduct = await product.findById({ _id: findu.productId });
                                        if (findProduct) {
                                                let price = Number(findu.total);
                                                console.log(price);
                                                let obj2 = {
                                                        price_data: {
                                                                currency: "inr",
                                                                product_data: {
                                                                        name: `${findProduct.productName}`,
                                                                },
                                                                unit_amount: `${Math.round(price * 100)}`,
                                                        },
                                                        quantity: 1,
                                                }
                                                line_items.push(obj2)
                                        }
                                }
                        }
                        const session = await stripe.checkout.sessions.create({
                                payment_method_types: ["card"],
                                success_url: `https://krishwholesale.co.uk/order-success/${findUserOrder.orderId}`,
                                cancel_url: `https://krishwholesale.co.uk/order-failure/${findUserOrder.orderId}`,
                                customer_email: req.user.email,
                                client_reference_id: findUserOrder.orderId,
                                line_items: line_items,
                                mode: "payment",
                        });
                        return res.status(200).json({ status: "success", session: session, });
                } else {
                        return res.status(404).json({ message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.cancelOrder = async (req, res) => {
        try {
                let findUserOrder = await userOrders.findOne({ orderId: req.params.orderId });
                if (findUserOrder) {
                        return res.status(201).json({ message: "Payment failed.", status: 201, orderId: req.params.orderId });
                } else {
                        return res.status(404).json({ message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.successOrder = async (req, res) => {
        try {
                let findUserOrder = await userOrders.findOne({ orderId: req.params.orderId });
                if (findUserOrder) {
                        const user = await User.findById({ _id: findUserOrder.userId });
                        if (!user) {
                                return res.status(404).send({ status: 404, message: "User not found or token expired." });
                        }
                        await userOrders.findByIdAndUpdate({ _id: findUserOrder._id }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
                        let obj1 = { user: findUserOrder.userId, orderId: findUserOrder._id, amount: findUserOrder.paidAmount, paymentMode: req.body.paymentMode, type: "Debit", Status: "paid", }
                        await transactionModel.create(obj1);
                        for (let i = 0; i < findUserOrder.Orders.length; i++) {
                                let findu = await order.findOne({ _id: findUserOrder.Orders[i] });
                                if (findu) {
                                        let updateConfirm = await order.findByIdAndUpdate({ _id: findu._id }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
                                        if (updateConfirm) {
                                                let userData = await User.findOne({ _id: updateConfirm.vendorId });
                                                if (userData) {
                                                        let wallet = await User.findByIdAndUpdate({ _id: userData._id }, { $set: { wallet: userData.wallet + updateConfirm.total } }, { new: true });
                                                        if (wallet) {
                                                                let obj = {
                                                                        user: userData._id,
                                                                        orderId: updateConfirm._id,
                                                                        amount: updateConfirm.total,
                                                                        paymentMode: req.body.paymentMode,
                                                                        type: "Credit",
                                                                        Status: "paid",
                                                                }
                                                                await transactionModel.create(obj);
                                                        }
                                                }
                                        }
                                }
                        }
                        let deleteCart = await cart.findOneAndDelete({ userId: findUserOrder.userId });
                        if (deleteCart) {
                                return res.status(200).json({ message: "Payment success.", status: 200, data: {} });
                        }
                } else {
                        return res.status(404).json({ message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.successOrderwithWallet = async (req, res) => {
        try {
                let findUserOrder = await userOrders.findOne({ orderId: req.params.orderId });
                if (findUserOrder) {
                        const user = await User.findById({ _id: findUserOrder.userId });
                        if (!user) {
                                return res.status(404).send({ status: 404, message: "User not found or token expired." });
                        }
                        let userData1 = await User.findOne({ _id: findUserOrder.userId });
                        if (userData1.wallet >= findUserOrder.paidAmount) {
                                await userOrders.findByIdAndUpdate({ _id: findUserOrder._id }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
                                if (userData1) {
                                        let wallet = await User.findByIdAndUpdate({ _id: userData1._id }, { $set: { wallet: userData1.wallet - findUserOrder.paidAmount } }, { new: true });
                                        if (wallet) {
                                                let obj1 = {
                                                        user: findUserOrder.userId,
                                                        orderId: findUserOrder.orderId,
                                                        amount: findUserOrder.paidAmount,
                                                        paymentMode: req.body.paymentMode,
                                                        type: "Debit",
                                                        Status: "paid",
                                                }
                                                await transactionModel.create(obj1);
                                        }
                                        for (let i = 0; i < findUserOrder.Orders.length; i++) {
                                                let findu = await order.findOne({ _id: findUserOrder.Orders[i] });
                                                if (findu) {
                                                        let updateConfirm = await order.findByIdAndUpdate({ _id: findu._id }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
                                                        if (updateConfirm) {
                                                                let userData = await User.findOne({ _id: updateConfirm.vendorId });
                                                                if (userData) {
                                                                        let wallet = await User.findByIdAndUpdate({ _id: userData._id }, { $set: { wallet: userData.wallet + updateConfirm.total } }, { new: true });
                                                                        if (wallet) {
                                                                                let obj = {
                                                                                        user: userData._id,
                                                                                        orderId: updateConfirm.orderId,
                                                                                        amount: updateConfirm.total,
                                                                                        paymentMode: req.body.paymentMode,
                                                                                        type: "Credit",
                                                                                        Status: "paid",
                                                                                }
                                                                                await transactionModel.create(obj);
                                                                        }
                                                                }
                                                        }
                                                }
                                        }
                                        let deleteCart = await cart.findOneAndDelete({ userId: findUserOrder.userId });
                                        if (deleteCart) {
                                                return res.status(200).json({ message: "Payment success.", status: 200, data: {} });
                                        }
                                }
                        } else {
                                return res.status(201).json({ message: "Payment not process, wallet balance is low.", status: 201, data: {} });
                        }
                } else {
                        return res.status(404).json({ message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getAllOrders = async (req, res, next) => {
        try {
                const orders = await userOrders.find({ userId: req.user._id, orderStatus: "confirmed" })
                        .populate({
                                path: 'Orders', populate: [
                                        { path: 'vendorId', model: 'user' },
                                        { path: 'productVarientId', model: 'productVarient', populate: [{ path: 'color', model: 'color' }] },
                                        { path: 'categoryId', model: 'Category' },
                                        { path: 'productId', model: 'product' },
                                        { path: 'unitId', model: 'quantityUnit' },
                                        { path: 'subcategoryId', model: 'subcategory' }
                                ]
                        })
                if (orders.length == 0) {
                        return res.status(404).json({ status: 404, message: "Orders not found", data: {} });
                }
                return res.status(200).json({ status: 200, msg: "orders of user", data: orders })
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getOrders = async (req, res, next) => {
        try {
                const orders = await order.find({ userId: req.user._id, orderStatus: "confirmed" }).populate("userId")
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
exports.getOrderbyId = async (req, res, next) => {
        try {
                const orders = await order.findById({ _id: req.params.id }).populate("userId")
                        .populate("vendorId")
                        .populate("categoryId")
                        .populate("subcategoryId")
                        .populate("productId")
                        .populate({ path: "productVarientId", populate: [{ path: "color", model: "color" }] })
                        .populate("unitId");
                if (!orders) {
                        return res.status(404).json({ status: 404, message: "Orders not found", data: {} });
                }
                return res.status(200).json({ status: 200, msg: "orders of user", data: orders })
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.allTransactionUser = async (req, res) => {
        try {
                const data = await transactionModel.find({ $or: [{ user: req.user._id }, { sender: req.user._id }, { reciver: req.user._id }] }).populate("user orderId reciver sender");
                return res.status(200).json({ data: data });
        } catch (err) {
                return res.status(400).json({ message: err.message });
        }
};
exports.allcreditTransactionUser = async (req, res) => {
        try {
                const data = await transactionModel.find({ $or: [{ user: req.user._id }, { sender: req.user._id }, { reciver: req.user._id }], type: "Credit" }).populate("user orderId reciver sender");
                return res.status(200).json({ data: data });
        } catch (err) {
                return res.status(400).json({ message: err.message });
        }
};
exports.allDebitTransactionUser = async (req, res) => {
        try {
                const data = await transactionModel.find({ $or: [{ user: req.user._id }, { sender: req.user._id }, { reciver: req.user._id }], type: "Debit" }).populate("user orderId reciver sender");
                return res.status(200).json({ data: data });
        } catch (err) {
                return res.status(400).json({ message: err.message });
        }
};
exports.addMoney = async (req, res) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        let update = await User.findByIdAndUpdate({ _id: data._id }, { $set: { wallet: data.wallet + parseInt(req.body.balance) } }, { new: true });
                        if (update) {
                                let obj = {
                                        user: req.user._id,
                                        date: Date.now(),
                                        amount: req.body.balance,
                                        type: "Credit",
                                        relatedPayments: "AddMoney"
                                };
                                const data1 = await transactionModel.create(obj);
                                if (data1) {
                                        return res.status(200).json({ status: 200, message: "Money has been added.", data: update, });
                                }
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getWallet = async (req, res) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        return res.status(200).json({ message: "get Profile", data: data.wallet });
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.sendMoney = async (req, res) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        let userData = await User.findOne({ _id: req.body.reciverId });
                        if (userData) {
                                let update = await User.findByIdAndUpdate({ _id: data._id }, { $set: { wallet: data.wallet - parseInt(req.body.balance) } }, { new: true });
                                let update1 = await User.findByIdAndUpdate({ _id: userData._id }, { $set: { wallet: userData.wallet + parseInt(req.body.balance) } }, { new: true });
                                if (update && update1) {
                                        let obj = {
                                                sender: req.user._id,
                                                reciver: userData._id,
                                                date: Date.now(),
                                                amount: req.body.balance,
                                                type: "Debit",
                                                relatedPayments: "sendMoney"
                                        };
                                        let obj1 = {
                                                sender: req.user._id,
                                                reciver: userData._id,
                                                date: Date.now(),
                                                amount: req.body.balance,
                                                type: "Credit",
                                                relatedPayments: "sendMoney"
                                        };
                                        const data1 = await transactionModel.create(obj, obj1);
                                        if (data1) {
                                                return res.status(200).json({ status: 200, message: "Money has been added.", data: update, });
                                        }
                                }
                        } else {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.createProductReview = async (req, res, next) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (!data) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        const { rating, comment, productId } = req.body;
                        const viewProduct = await product.findById(productId);
                        if (viewProduct.reviews.length == 0) {
                                const review = {
                                        user: req.user._id,
                                        name: req.user.name,
                                        rating: Number(rating),
                                        comment,
                                };
                                viewProduct.reviews.push(review);
                                viewProduct.numOfReviews = viewProduct.reviews.length;
                        } else {
                                const isReviewed = viewProduct.reviews.find((rev) => { rev.user.toString() === req.user._id.toString() });
                                if (isReviewed) {
                                        viewProduct.reviews.forEach((rev) => {
                                                if (rev.user.toString() === req.user._id.toString()) (rev.rating = rating), (rev.comment = comment);
                                        });
                                } else {
                                        const review = {
                                                user: req.user._id,
                                                name: req.user.name,
                                                rating: Number(rating),
                                                comment,
                                        };
                                        viewProduct.reviews.push(review);
                                        viewProduct.numOfReviews = viewProduct.reviews.length;
                                }
                        }
                        let avg = 0;
                        viewProduct.reviews.forEach((rev) => { avg += rev.rating; });
                        viewProduct.avgRatingsProduct = avg / viewProduct.reviews.length;
                        viewProduct.totalRating = viewProduct.reviews.length
                        await viewProduct.save({ validateBeforeSave: false })
                        const findProduct = await product.findById(productId);
                        return res.status(200).json({ status: 200, data: findProduct.reviews });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getProductReviews = async (req, res, next) => {
        const findProduct = await product.findById(req.params.id).populate({ path: 'reviews.user', select: 'fullName' }).select('reviews');
        if (!findProduct) {
                return res.status(404).json({ message: "Product not found.", status: 404, data: {} });
        }
        return res.status(200).json({ status: 200, reviews: findProduct, });
};
exports.updateQuantity = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id, userType: userType.USER });
                if (!userData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findCart = await cart.findOne({ userId: userData._id });
                        if (findCart) {
                                let productId;
                                const found = await findCart.products.some(el => (
                                        (el._id).toString() === (req.body.productid).toString(), productId = el.productId
                                ));
                                console.log(productId);
                                if (!found) {
                                        return res.status(200).send({ status: 200, message: "Cart detail found.", data: findCart });
                                } else {
                                        let findProduct = await product.findById({ _id: productId });
                                        if (!findProduct) {
                                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                        }
                                        let price = 0;
                                        if (findProduct.discountActive == true) {
                                                price = findProduct.discountPrice;
                                        } else {
                                                price = findProduct.originalPrice;
                                        }
                                        let quantity = req.body.quantity;
                                        let total = price * req.body.quantity;
                                        let updateCart = await cart.findOneAndUpdate({ userId: userData._id, 'products._id': req.body.productid }, { $set: { 'products.$.productPrice': price, 'products.$.quantity': quantity, 'products.$.total': total } }, { new: true });
                                        if (updateCart) {
                                                let totalAmount = 0;
                                                let totalItem = updateCart.products.length;
                                                for (let l = 0; l < updateCart.products.length; l++) {
                                                        totalAmount = totalAmount + updateCart.products[l].total;
                                                }
                                                let b = await cart.findByIdAndUpdate({ _id: updateCart._id }, { $set: { totalAmount: totalAmount, totalItem: totalItem } }, { new: true })
                                                return res.status(200).send({ message: "Product add to cart.", data: b, });
                                        }

                                };
                        } else {
                                return res.status(200).send({ status: 200, message: "Cart detail not found.", data: {} });
                        }
                }
        } catch (error) {
                console.log(error)
                return res.status(500).send({ message: "Internal Server error" + error.message });
        }
};
exports.cancelReturnOrder = async (req, res, next) => {
        try {
                const orders = await order.findById({ _id: req.params.id });
                if (!orders) {
                        return res.status(404).json({ status: 404, message: "Orders not found", data: {} });
                } else {
                        let obj = {
                                userId: orders.userId,
                                vendorId: orders.vendorId,
                                Orders: orders._id,
                                reason: req.body.reason,
                                orderStatus: req.body.orderStatus,
                                pickStatus: "Pending"
                        }
                        const data = await cancelReturnOrder.create(obj);
                        let update = await order.findByIdAndUpdate({ _id: orders._id }, { $set: { returnOrder: data._id, returnStatus: req.body.orderStatus, returnPickStatus: "Pending" } }, { new: true }).populate('returnOrder');
                        if (update) {
                                res.status(200).json({ message: `Order ${req.body.orderStatus} Successfully.`, status: 200, data: update });
                        }
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getcancelReturnOrder = async (req, res, next) => {
        try {
                const orders = await cancelReturnOrder.find({ userId: req.user._id }).populate('Orders');
                if (orders.length == 0) {
                        return res.status(404).json({ status: 404, message: "Orders not found", data: {} });
                }
                return res.status(200).json({ status: 200, msg: "orders of user", data: orders })
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
// const stripe = require("stripe")('pk_live_51NYCJcArS6Dr0SQYUKlqAd37V2GZMbxBL6OGM9sZi8CY6nv6H7TUJcjfMiepBmkIdSdn1bUCo855sQuKb66oiM4j00PRLQzvUc'); // live
const stripe = require("stripe")('sk_test_51NYCJcArS6Dr0SQY0UJ5ZOoiPHQ8R5jNOyCMOkjxpl4BHkG4DcAGAU8tjBw6TSOSfimDSELa6BVyCVSo9CGLXlyX00GkGDAQFo'); // test
