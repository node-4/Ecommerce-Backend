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
const reffralCode = async () => {
        var digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let OTP = '';
        for (let i = 0; i < 9; i++) {
                OTP += digits[Math.floor(Math.random() * 36)];
        }
        return OTP;
}