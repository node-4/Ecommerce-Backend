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

exports.getCategories = async (req, res) => {
        const categories = await Category.find({ gender: req.params.gender });
        if (categories.length == 0) {
                return res.status(404).json({ message: "category not found.", status: 404, data: {} });
        }
        res.status(200).json({ status: 200, message: "Category data found.", data: categories });
};
exports.getSubCategoryByCategoryId = async (req, res) => {
        try {
                const data = await subCategory.find({ categoryId: req.params.categoryId });
                if (!data || data.length === 0) {
                        return res.status(404).json({ message: "Sub Category not found.", status: 404, data: {} });
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
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        } else {
                                return res.status(200).send({ status: 200, message: "Product data found successfully.", data: transRes });
                        }
                })

        } catch (error) {
                console.log(error)
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
                        let findCart = await cart.findOne({ userId: user._id }).populate("userId").populate("products.vendorId").populate("products.categoryId").populate("products.subcategoryId").populate("products.productId").populate("products.productVarientId").populate("products.unitId")
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
const reffralCode = async () => {
        var digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let OTP = '';
        for (let i = 0; i < 9; i++) {
                OTP += digits[Math.floor(Math.random() * 36)];
        }
        return OTP;
}