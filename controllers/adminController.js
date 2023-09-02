const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authConfig = require("../configs/auth.config");
const User = require("../models/userModel");
const Category = require("../models/categoryModel");
const subCategory = require("../models/subCategoryModel");
const kycStatus = require('../enums/kycStatus');
const transactionModel = require("../models/transactionModel");
const order = require("../models/order/orderModel");
const banner = require("../models/banner");
const helpandSupport = require("../models/helpAndSupport");
const contact = require("../models/contactDetail");
const notification = require("../models/notification");
const Coupan = require('../models/Coupan')
const vendorKyc = require("../models/vendorKyc");
const product = require('../models/productModel');
const cancelReturnOrder = require("../models/order/cancelReturnOrder");
const offer = require('../models/offer');
exports.registration = async (req, res) => {
        const { phone, email } = req.body;
        try {
                req.body.email = email.split(" ").join("").toLowerCase();
                let user = await User.findOne({ $and: [{ $or: [{ email: req.body.email }, { phone: phone }] }], userType: "ADMIN" });
                if (!user) {
                        req.body.password = bcrypt.hashSync(req.body.password, 8);
                        req.body.userType = "ADMIN";
                        req.body.accountVerification = true;
                        req.body.fullName = `${req.body.firstName} ${req.body.lastName}`
                        const userCreate = await User.create(req.body);
                        return res.status(200).send({ status: 200, message: "registered successfully ", data: userCreate, });
                } else {
                        return res.status(409).send({ status: 409, message: "Already Exist", data: [] });
                }
        } catch (error) {

                return res.status(500).json({ message: "Server error" });
        }
};
exports.signin = async (req, res) => {
        try {
                const { email, password } = req.body;
                const user = await User.findOne({ email: email, userType: "ADMIN" });
                if (!user) {
                        return res.status(404).send({ status: 404, message: "user not found ! not registered" });
                }
                const isValidPassword = bcrypt.compareSync(password, user.password);
                if (!isValidPassword) {
                        return res.status(401).send({ status: 401, message: "Wrong password" });
                }
                const accessToken = jwt.sign({ id: user._id }, authConfig.secret, { expiresIn: authConfig.accessTokenTime, });
                return res.status(201).send({ status: 200, data: user, accessToken: accessToken });
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.getProfile = async (req, res) => {
        try {
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ status: 404, message: "not found" });
                }
                return res.status(200).send({ status: 200, message: "Get user details.", data: user });
        } catch (err) {
                console.log(err);
                return res.status(500).send({ status: 500, message: "internal server error " + err.message, });
        }
};
exports.update = async (req, res) => {
        try {
                const { firstName, lastName, email, phone, password } = req.body;
                const user = await User.findById(req.user.id);
                if (!user) {
                        return res.status(404).send({ message: "not found" });
                }
                user.firstName = firstName || user.firstName;
                user.lastName = lastName || user.lastName;
                user.email = email || user.email;
                user.phone = phone || user.phone;
                if (req.body.password) {
                        user.password = bcrypt.hashSync(password, 8) || user.password;
                }
                const updated = await user.save();
                return res.status(200).send({ message: "updated", data: updated });
        } catch (err) {
                console.log(err);
                return res.status(500).send({
                        message: "internal server error " + err.message,
                });
        }
};
exports.blockUnblockUser = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).json({ status: 404, message: "User not found" });
                } else {
                        let findUser = await User.findOne({ _id: req.params.id });
                        if (!findUser) {
                                return res.status(404).json({ message: "User not found.", status: 404, data: {} });
                        } else {
                                if (findUser.status == "Active") {
                                        let findUser1 = await User.findByIdAndUpdate({ _id: findUser._id }, { $set: { status: "Block" } }, { new: true });
                                        if (findUser1) {
                                                return res.status(200).json({ message: "User block successfully.", status: 200, data: findUser1 });
                                        }
                                } else {
                                        let findUser1 = await User.findByIdAndUpdate({ _id: findUser._id }, { $set: { status: "Active" } }, { new: true });
                                        if (findUser1) {
                                                return res.status(200).json({ message: "User active successfully.", status: 200, data: findUser1 });
                                        }
                                }
                        }
                }
        } catch (error) {
                return res.status(500).send({ msg: "internal server error", error: error, });
        }
};
exports.getAllUser = async (req, res) => {
        try {
                const user = await User.find({ userType: "USER" });
                if (user.length == 0) {
                        return res.status(404).send({ message: "not found" });
                }
                return res.status(200).send({ message: "Get user details.", data: user });
        } catch (err) {
                console.log(err);
                return res.status(500).send({
                        message: "internal server error " + err.message,
                });
        }
};
exports.viewUser = async (req, res) => {
        try {
                const data = await User.findById(req.params.id);
                if (!data) {
                        return res.status(400).send({ msg: "not found" });
                }
                let findAddress = await userAddress.findOne({ userId: data._id, type: "Registration" });
                return res.status(200).send({ msg: "Data found successfully", data: data, address: findAddress });
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.deleteUser = async (req, res) => {
        try {
                const data = await User.findByIdAndDelete(req.params.id);
                if (!data) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).send({ msg: "deleted", data: data });
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.getAllVendor = async (req, res) => {
        try {
                const user = await User.find({ userType: "VENDOR" });
                if (user.length == 0) {
                        return res.status(404).send({ message: "not found" });
                }
                return res.status(200).send({ message: "Get user details.", data: user });
        } catch (err) {
                console.log(err);
                return res.status(500).send({
                        message: "internal server error " + err.message,
                });
        }
};
exports.createCategory = async (req, res) => {
        try {
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ status: 404, message: "not found" });
                }
                let findCategory = await Category.findOne({ name: req.body.name, gender: req.body.gender });
                if (findCategory) {
                        return res.status(409).json({ message: "category already exit.", status: 404, data: {} });
                } else {
                        let data;
                        if (user.userType == "VENDOR") {
                                data = { name: req.body.name, gender: req.body.gender, vendorId: user._id, status: "Block", approvalStatus: "Pending" };
                        } else {
                                data = { name: req.body.name, gender: req.body.gender, status: "Active", approvalStatus: "Accept" };
                        }
                        const category = await Category.create(data);
                        return res.status(200).json({ message: "category add successfully.", status: 200, data: category });
                }
        } catch (error) {
                return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
        }
};
exports.getCategories = async (req, res) => {
        const categories = await Category.find({});
        if (categories.length == 0) {
                return res.status(404).json({ message: "category not found.", status: 404, data: {} });
        }
        return res.status(200).json({ status: 200, message: "Category data found.", data: categories });
};
exports.paginateCategoriesSearch = async (req, res) => {
        try {
                const { search, fromDate, toDate, page, limit } = req.query;
                let query = {};
                if (search) {
                        query.$or = [
                                { "name": { $regex: req.query.search, $options: "i" }, },
                        ]
                }
                if ((fromDate != 'null') && (toDate == 'null')) {
                        query.createdAt = { $gte: fromDate };
                }
                if ((fromDate == 'null') && (toDate != 'null')) {
                        query.createdAt = { $lte: toDate };
                }
                if ((fromDate != 'null') && (toDate != 'null')) {
                        query.$and = [
                                { createdAt: { $gte: fromDate } },
                                { createdAt: { $lte: toDate } },
                        ]
                }
                let options = {
                        page: Number(page) || 1,
                        limit: Number(limit) || 10,
                        sort: { createdAt: -1 },
                };
                let data = await Category.paginate(query, options);
                return res.status(200).json({ status: 200, message: "Category data found.", data: data });

        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.updateCategory = async (req, res) => {
        try {
                const { id } = req.params;
                const category = await Category.findById(id);
                if (!category) {
                        return res.status(404).json({ message: "Category Not Found", status: 404, data: {} });
                }
                category.gender = req.body.gender || category.gender;
                category.name = req.body.name || category.name;
                category.status = category.status;
                category.approvalStatus = category.approvalStatus;
                category.vendorId = category.vendorId;
                let update = await category.save();
                return res.status(200).json({ status: 200, message: "Updated Successfully", data: update });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.approvedRejectCategory = async (req, res) => {
        try {
                const { id } = req.params;
                const findProduct = await Category.findById({ _id: id });
                if (!findProduct) {
                        return res.status(404).json({ message: "Category Not Found", status: 404, data: {} });
                }
                if (req.body.approvalStatus == "Accept") {
                        let saveStore = await Category.findByIdAndUpdate({ _id: findProduct._id }, { $set: { status: "Active", approvalStatus: "Accept" } }, { new: true });
                        return res.status(200).json({ status: 200, message: "Updated Successfully", data: saveStore });
                }
                if (req.body.approvalStatus == "Reject") {
                        let saveStore = await Category.findByIdAndUpdate({ _id: findProduct._id }, { $set: { status: "Block", approvalStatus: "Reject" } }, { new: true });
                        return res.status(200).json({ status: 200, message: "Updated Successfully", data: saveStore });
                }
                if (req.body.approvalStatus == "Pending") {
                        let saveStore = await Category.findByIdAndUpdate({ _id: findProduct._id }, { $set: { status: "Block", approvalStatus: "Pending" } }, { new: true });
                        return res.status(200).json({ status: 200, message: "Updated Successfully", data: saveStore });
                }
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.removeCategory = async (req, res) => {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) {
                return res.status(404).json({ message: "Category Not Found", status: 404, data: {} });
        } else {
                await Category.findByIdAndDelete(category._id);
                return res.status(200).json({ message: "Category Deleted Successfully !" });
        }
};
exports.createSubCategory = async (req, res) => {
        try {
                const data = await Category.findById(req.body.categoryId);
                if (!data || data.length === 0) {
                        return res.status(400).send({ status: 404, msg: "not found" });
                }
                let image;
                if (req.file) {
                        image = req.file.path
                }
                const subcategoryCreated = await subCategory.create({ name: req.body.name, image: image, gender: data.gender, categoryId: data._id });
                return res.status(201).send({ status: 200, message: "Sub Category add successfully", data: subcategoryCreated, });
        } catch (err) {
                return res.status(500).send({ message: "Internal server error while creating sub category", });
        }
};
exports.getSubCategoryForAdmin = async (req, res) => {
        try {
                const data = await subCategory.find({}).populate('categoryId');
                if (data.length > 0) {
                        return res.status(200).json({ status: 200, message: "Sub Category data found.", data: data });
                } else {
                        return res.status(404).json({ status: 404, message: "Sub Category data not found.", data: {} });
                }
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.paginateSubCategoriesSearch = async (req, res) => {
        try {
                console.log("------------------------");
                const { search, fromDate, toDate, page, limit } = req.query;
                let query = {};
                if (search) {
                        query.$or = [
                                { "name": { $regex: req.query.search, $options: "i" }, },
                        ]
                }
                if ((fromDate != 'null') && (toDate == 'null')) {
                        query.createdAt = { $gte: fromDate };
                }
                if ((fromDate == 'null') && (toDate != 'null')) {
                        query.createdAt = { $lte: toDate };
                }
                if ((fromDate != 'null') && (toDate != 'null')) {
                        query.$and = [
                                { createdAt: { $gte: fromDate } },
                                { createdAt: { $lte: toDate } },
                        ]
                }
                let options = {
                        page: Number(page) || 1,
                        limit: Number(limit) || 10,
                        sort: { createdAt: -1 },
                        populate: ('categoryId')
                };
                let data = await subCategory.paginate(query, options);
                return res.status(200).json({ status: 200, message: "Sub Category data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.getSubCategory = async (req, res) => {
        try {
                const categories = await Category.find({});
                if (categories.length == 0) {
                        return res.status(404).json({ message: "Data not found.", status: 404, data: {} });
                } else {
                        let Array = []
                        for (let i = 0; i < categories.length; i++) {
                                const data = await subCategory.find({ categoryId: categories[i]._id });
                                let obj = {
                                        category: categories[i],
                                        subCategory: data
                                }
                                Array.push(obj)
                        }
                        return res.status(200).json({ status: 200, message: "Sub Category data found.", data: Array });
                }
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.getIdSubCategory = async (req, res) => {
        try {
                const data = await subCategory.findById(req.params.id);
                if (!data || data.length === 0) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).json({ status: 200, message: "Sub Category data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.updateSubCategory = async (req, res) => {
        try {
                let id = req.params.id
                const findSubCategory = await subCategory.findById(id);
                if (!findSubCategory) {
                        return res.status(404).json({ status: 404, message: "Sub Category Not Found", data: {} });
                }
                let findCategory;
                if (req.body.categoryId != "null") {
                        findCategory = await Category.findById({ _id: req.body.categoryId });
                        if (!findCategory || findCategory.length === 0) {
                                return res.status(400).send({ status: 404, msg: "Category not found" });
                        }
                }
                let image;
                if (req.file) {
                        image = req.file.path
                }
                req.body.image = image || findSubCategory.image;
                req.body.categoryId = findCategory._id || findSubCategory.categoryId;
                req.body.gender = findCategory.gender || findSubCategory.gender
                req.body.name = req.body.name || findSubCategory.name;
                const data = await subCategory.findByIdAndUpdate(findSubCategory._id, req.body, { new: true });
                if (data) {
                        return res.status(200).send({ status: 200, msg: "updated", data: data });
                }
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({
                        msg: "internal server error ",
                        error: err.message,
                });
        }
};
exports.deleteSubCategory = async (req, res) => {
        try {
                const data = await subCategory.findByIdAndDelete(req.params.id);
                if (!data) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).send({ msg: "deleted", data: data });
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({
                        msg: "internal server error",
                        error: err.message,
                });
        }
};
exports.getSubCategoryByCategoryId = async (req, res) => {
        try {
                const data = await subCategory.find({ categoryId: req.params.categoryId }).populate('categoryId');
                if (!data || data.length === 0) {
                        return res.status(200).json({ status: 200, message: "No data found", data: [] });
                }
                return res.status(200).json({ status: 200, message: "Sub Category data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.allTransactionUser = async (req, res) => {
        try {
                const data = await transactionModel.find({}).populate("user orderId");
                return res.status(200).json({ data: data });
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.allcreditTransactionUser = async (req, res) => {
        try {
                const data = await transactionModel.find({ type: "Credit" }).populate("user orderId")
                return res.status(200).json({ data: data });
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.allDebitTransactionUser = async (req, res) => {
        try {
                const data = await transactionModel.find({ type: "Debit" }).populate("user orderId")
                return res.status(200).json({ data: data });
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getOrders = async (req, res, next) => {
        try {
                const orders = await order.find({ orderStatus: "confirmed" }).populate("userId").populate("vendorId").populate("categoryId").populate("subcategoryId").populate("productId").populate({ path: "productVarientId", populate: [{ path: "color", model: "color" }] }).populate("unitId");
                if (orders.length == 0) {
                        return res.status(404).json({ status: 404, message: "Orders not found", data: {} });
                }
                return res.status(200).json({ status: 200, msg: "orders of user", data: orders })
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.createBanner = async (req, res) => {
        try {
                let bannerImage, data;
                if (req.file.path) {
                        bannerImage = req.file.path
                }
                req.body.desc = req.body.desc;
                req.body.image = bannerImage;
                req.body.type = req.body.type;
                req.body.productId = req.body.productId;

                const Banner = await banner.create(req.body);
                return res.status(200).json({ message: "Banner add successfully.", status: 200, data: Banner });
        } catch (error) {
                return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
        }
};
exports.getBanner = async (req, res) => {
        try {
                if (req.query.type != (null || undefined)) {
                        const data = await banner.find({ type: req.query.type }).populate('productId')
                        if (data.length === 0) {
                                return res.status(400).send({ msg: "not found" });
                        }
                        return res.status(200).json({ status: 200, message: "Banner data found.", data: data });
                }
                const data = await banner.find({}).populate('productId')
                if (data.length === 0) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).json({ status: 200, message: "Banner data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.getIdBanner = async (req, res) => {
        try {
                const data = await banner.findById(req.params.id)
                if (!data) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).json({ status: 200, message: "Banner data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
}
exports.deleteBanner = async (req, res) => {
        try {
                const data = await banner.findByIdAndDelete(req.params.id);
                if (!data) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).send({ msg: "deleted", data: data });
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.updateBanner = async (req, res) => {
        try {
                const findData = await banner.findById(req.params.id);
                if (!findData) {
                        return res.status(400).send({ msg: "not found" });
                }
                let data;
                let bannerImage;
                if (req.file.path) {
                        bannerImage = req.file.path
                }
                data = {
                        desc: req.body.desc || findData.desc,
                        type: req.body.type || findData.type,
                        image: bannerImage || findData.image,
                };
                const Banner = await banner.findByIdAndUpdate({ _id: findData._id }, { $set: data }, { new: true })
                return res.status(200).json({ message: "Banner update successfully.", status: 200, data: Banner });
        } catch (error) {
                return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
        }
};
exports.addQuery = async (req, res) => {
        try {
                if ((req.body.name == (null || undefined)) || (req.body.email == (null || undefined)) || (req.body.name == "") || (req.body.email == "")) {
                        return res.status(404).json({ message: "name and email provide!", status: 404, data: {} });
                } else {
                        const Data = await helpandSupport.create(req.body);
                        return res.status(200).json({ message: "Help and Support  create.", status: 200, data: Data });
                }

        } catch (err) {
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.getAllHelpandSupport = async (req, res) => {
        try {
                const data = await helpandSupport.find();
                if (data.length == 0) {
                        return res.status(404).json({ message: "Help and Support not found.", status: 404, data: {} });
                }
                return res.status(200).json({ message: "Help and Support  found.", status: 200, data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.getHelpandSupportById = async (req, res) => {
        try {
                const data = await helpandSupport.findById(req.params.id);
                if (!data) {
                        return res.status(404).json({ message: "Help and Support not found.", status: 404, data: {} });
                }
                return res.status(200).json({ message: "Help and Support  found.", status: 200, data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.deleteHelpandSupport = async (req, res) => {
        try {
                const data = await helpandSupport.findById(req.params.id);
                if (!data) {
                        return res.status(404).json({ message: "Help and Support not found.", status: 404, data: {} });
                }
                await helpandSupport.deleteOne({ _id: req.params.id });
                return res.status(200).json({ message: "Help and Support  delete.", status: 200, data: {} });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.addContactDetails = async (req, res) => {
        try {
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ message: "not found" });
                } else {
                        let findContact = await contact.findOne();
                        if (findContact) {
                                let obj = {
                                        fb: req.body.fb || findContact.fb,
                                        twitter: req.body.twitter || findContact.twitter,
                                        google: req.body.google || findContact.google,
                                        instagram: req.body.instagram || findContact.instagram,
                                        basketball: req.body.basketball || findContact.basketball,
                                        behance: req.body.behance || findContact.behance,
                                        dribbble: req.body.dribbble || findContact.dribbble,
                                        pinterest: req.body.pinterest || findContact.pinterest,
                                        linkedIn: req.body.linkedIn || findContact.linkedIn,
                                        youtube: req.body.youtube || findContact.youtube,
                                        map: req.body.map || findContact.map,
                                        address: req.body.address || findContact.address,
                                        phone: req.body.phone || findContact.phone,
                                        supportEmail: req.body.supportEmail || findContact.supportEmail,
                                        openingTime: req.body.openingTime || findContact.openingTime,
                                        infoEmail: req.body.infoEmail || findContact.infoEmail,
                                        contactAddress: req.body.contactAddress || findContact.contactAddress,
                                        tollfreeNo: req.body.tollfreeNo || findContact.tollfreeNo,
                                }
                                let updateContact = await contact.findByIdAndUpdate({ _id: findContact._id }, { $set: obj }, { new: true });
                                if (updateContact) {
                                        return res.status(200).json({ message: "Contact detail update successfully.", status: 200, data: updateContact });
                                }
                        } else {
                                let result2 = await contact.create(req.body);
                                if (result2) {
                                        return res.status(200).json({ message: "Contact detail add successfully.", status: 200, data: result2 });
                                }
                        }
                }
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.viewContactDetails = async (req, res) => {
        try {
                let findcontactDetails = await contact.findOne({});
                if (!findcontactDetails) {
                        return res.status(404).json({ message: "Contact detail not found.", status: 404, data: {} });
                } else {
                        return res.status(200).json({ message: "Contact detail found successfully.", status: 200, data: findcontactDetails });
                }
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.sendNotification = async (req, res) => {
        try {
                const admin = await User.findById({ _id: req.user._id });
                if (!admin) {
                        return res.status(404).json({ status: 404, message: "Admin not found" });
                } else {
                        if (req.body.total == "ALL") {
                                let userData = await User.find({ userType: req.body.sendTo });
                                if (userData.length == 0) {
                                        return res.status(404).json({ status: 404, message: "Employee not found" });
                                } else {
                                        console.log("-----------------");
                                        for (let i = 0; i < userData.length; i++) {
                                                console.log("-----------------", userData[i]._id);
                                                let obj = {
                                                        userId: userData[i]._id,
                                                        title: req.body.title,
                                                        productId: req.body.productId,
                                                        body: req.body.body,
                                                        date: req.body.date,
                                                        image: req.body.image,
                                                        time: req.body.time,
                                                }
                                                await notification.create(obj)
                                        }
                                        let obj1 = {
                                                userId: admin._id,
                                                title: req.body.title,
                                                productId: req.body.productId,
                                                body: req.body.body,
                                                date: req.body.date,
                                                image: req.body.image,
                                                time: req.body.time,
                                        }
                                        await notification.create(obj1)
                                        return res.status(200).json({ status: 200, message: "Notification send successfully." });
                                }
                        }
                        if (req.body.total == "SINGLE") {
                                let userData = await User.findById({ _id: req.body._id, userType: req.body.sendTo });
                                if (!userData) {
                                        return res.status(404).json({ status: 404, message: "Employee not found" });
                                } else {
                                        let obj = {
                                                userId: userData._id,
                                                productId: req.body.productId,
                                                title: req.body.title,
                                                body: req.body.body,
                                                date: req.body.date,
                                                image: req.body.image,
                                                time: req.body.time,
                                        }
                                        let data = await notification.create(obj)
                                        if (data) {
                                                let obj1 = {
                                                        userId: admin._id,
                                                        productId: req.body.productId,
                                                        title: req.body.title,
                                                        body: req.body.body,
                                                        date: req.body.date,
                                                        image: req.body.image,
                                                        time: req.body.time,
                                                }
                                                await notification.create(obj1)
                                                return res.status(200).json({ status: 200, message: "Notification send successfully.", data: data });
                                        }
                                }
                        }
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
}
exports.allNotification = async (req, res) => {
        try {
                const admin = await User.findById({ _id: req.user._id });
                if (!admin) {
                        return res.status(404).json({ status: 404, message: "Admin not found" });
                } else {
                        let findNotification = await notification.find({ userId: admin._id }).populate('userId productId');
                        if (findNotification.length == 0) {
                                return res.status(404).json({ status: 404, message: "Notification data not found successfully.", data: {} })
                        } else {
                                return res.status(200).json({ status: 200, message: "Notification data found successfully.", data: findNotification })
                        }
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
}
exports.addCoupan = async (req, res) => {
        try {
                const d = new Date(req.body.expirationDate);
                req.body.expirationDate = d.toISOString();
                const de = new Date(req.body.activationDate);
                req.body.activationDate = de.toISOString();
                req.body.couponCode = await reffralCode();
                let saveStore = await Coupan(req.body).save();
                if (saveStore) {
                        return res.json({ status: 200, message: 'Coupan add successfully.', data: saveStore });
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.listCoupan = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user._id });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findService = await Coupan.find({});
                        if (findService.length == 0) {
                                return res.status(404).send({ status: 404, message: "Data not found" });
                        } else {
                                return res.json({ status: 200, message: 'Coupan Data found successfully.', service: findService });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.deleteCoupan = async (req, res) => {
        try {
                const data = await Coupan.findById(req.params.id);
                if (!data) {
                        return res.status(404).json({ message: "Coupan not found.", status: 404, data: {} });
                }
                await Coupan.findByIdAndDelete({ _id: req.params.id });
                return res.status(200).json({ message: "Coupan  delete.", status: 200, data: {} });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.vendorKycVerification = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).json({ status: 404, message: "User not found" });
                } else {
                        let findVendorKyc = await vendorKyc.findOne({ _id: req.body.kycId });
                        if (!findVendorKyc) {
                                return res.status(404).json({ message: "Kyc document not found.", status: 404, data: {} });
                        } else {
                                // UPLOADED','PENDING','APPROVED','REJECT'
                                let updateKyc;
                                if (req.body.kycStatus == 'APPROVED') {
                                        updateKyc = await vendorKyc.findByIdAndUpdate({ _id: findVendorKyc._id }, { $set: { kycStatus: 'APPROVED' } }, { new: true });
                                        if (updateKyc) {
                                                let userData1 = await User.findByIdAndUpdate({ _id: updateKyc.vendorId }, { $set: { kycStatus: 'APPROVED' } }, { new: true });
                                                let findVendorKyc1 = await vendorKyc.findOne({ _id: req.body.kycId });
                                                return res.status(200).json({ message: "Kyc verification update successfully.", status: 200, data: findVendorKyc1 });
                                        }
                                } else if (req.body.kycStatus == "REJECT") {
                                        updateKyc = await vendorKyc.findByIdAndUpdate({ _id: findVendorKyc._id }, { $set: { kycStatus: "REJECT" } }, { new: true });
                                        if (updateKyc) {
                                                let userData1 = await User.findByIdAndUpdate({ _id: updateKyc.vendorId }, { $set: { kycStatus: "REJECT" } }, { new: true });
                                                let findVendorKyc1 = await vendorKyc.findOne({ _id: req.body.kycId });
                                                return res.status(200).json({ message: "Kyc verification update successfully.", status: 200, data: findVendorKyc1 });
                                        }
                                } else if (req.body.kycStatus == "PENDING") {
                                        updateKyc = await vendorKyc.findByIdAndUpdate({ _id: findVendorKyc._id }, { $set: { kycStatus: "PENDING" } }, { new: true });
                                        if (updateKyc) {
                                                let userData1 = await User.findByIdAndUpdate({ _id: updateKyc.vendorId }, { $set: { kycStatus: "PENDING" } }, { new: true });
                                                let findVendorKyc1 = await vendorKyc.findOne({ _id: req.body.kycId });
                                                return res.status(200).json({ message: "Kyc verification update successfully.", status: 200, data: findVendorKyc1 });
                                        }
                                } else if (req.body.kycStatus == "UPLOADED") {
                                        updateKyc = await vendorKyc.findByIdAndUpdate({ _id: findVendorKyc._id }, { $set: { kycStatus: "UPLOADED" } }, { new: true });
                                        if (updateKyc) {
                                                let userData1 = await User.findByIdAndUpdate({ _id: updateKyc.vendorId }, { $set: { kycStatus: "UPLOADED" } }, { new: true });
                                                let findVendorKyc1 = await vendorKyc.findOne({ _id: req.body.kycId });
                                                return res.status(200).json({ message: "Kyc verification update successfully.", status: 200, data: findVendorKyc1 });
                                        }
                                }
                        }

                }
        } catch (error) {
                return res.status(500).send({ msg: "internal server error", error: error, });
        }
};
exports.KycList = async (req, res) => {
        try {
                const vendorData = await User.findOne({ _id: req.user._id, });
                if (!vendorData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let driverResult = await vendorKyc.find({}).sort({ "createAt": -1 })
                        if (driverResult.length == 0) {
                                return res.status(200).json({ status: 200, msg: "Kyc data fetch.", data: [] })
                        } else {
                                return res.status(200).json({ status: 20, msg: "Kyc data fetch.", data: driverResult })
                        }
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                        populate: { path: 'categoryId subcategoryId vendorId' }
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
exports.dashboard = async (req, res, next) => {
        try {
                const findProduct = await product.find({}).count()
                const category = await Category.find({}).count()
                const subcategory = await subCategory.find({}).count()
                const user = await User.find({ userType: "USER" }).count()
                const vendor = await User.find({ userType: "VENDOR" }).count()
                let obj = {
                        product: findProduct,
                        category: category,
                        subcategory: subcategory,
                        user: user,
                        vendor: vendor
                }
                return res.status(200).json({ status: 200, msg: "orders of user", data: obj })
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getcancelReturnOrder = async (req, res, next) => {
        try {
                const orders = await cancelReturnOrder.find({}).populate('Orders');
                if (orders.length == 0) {
                        return res.status(404).json({ status: 404, message: "Orders not found", data: {} });
                }
                return res.status(200).json({ status: 200, msg: "orders of user", data: orders })
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.acceptRejectCancelReturnOrder = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).json({ status: 404, message: "User not found" });
                } else {
                        let findUser = await cancelReturnOrder.findOne({ _id: req.params.id });
                        if (!findUser) {
                                return res.status(404).json({ message: "Order not found.", status: 404, data: {} });
                        } else {
                                if (req.body.pickStatus == "Reject") {
                                        let findUser1 = await cancelReturnOrder.findByIdAndUpdate({ _id: findUser._id }, { $set: { pickStatus: req.body.pickStatus } }, { new: true });
                                        if (findUser1) {
                                                const orders = await order.findById({ _id: findUser.Orders })
                                                if (!orders) {
                                                        return res.status(404).json({ status: 404, message: "Orders not found", data: {} });
                                                }
                                                await order.findByIdAndUpdate({ _id: orders._id }, { $set: { returnPickStatus: req.body.pickStatus, returnStatus: "" } }, { new: true });
                                                return res.status(200).json({ message: "Reject return successfully.", status: 200, data: findUser });
                                        }
                                } else {
                                        let findUser1 = await cancelReturnOrder.findByIdAndUpdate({ _id: findUser._id }, { $set: { pickStatus: req.body.pickStatus } }, { new: true });
                                        if (findUser1) {
                                                const orders = await order.findById({ _id: findUser.Orders })
                                                if (!orders) {
                                                        return res.status(404).json({ status: 404, message: "Orders not found", data: {} });
                                                }
                                                await order.findByIdAndUpdate({ _id: orders._id }, { $set: { returnPickStatus: req.body.pickStatus } }, { new: true });
                                                return res.status(200).json({ message: "Accept return successfully.", status: 200, data: findUser });
                                        }
                                }
                        }
                }
        } catch (error) {
                return res.status(500).send({ msg: "internal server error", error: error, });
        }
};
exports.addOffer = async (req, res) => {
        try {
                if (req.body.userId != (null || undefined)) {
                        let vendorData = await User.findOne({ _id: req.body.userId });
                        if (!vendorData) {
                                return res.status(404).send({ status: 404, message: "User not found" });
                        }
                        if (req.body.categoryId != (null || undefined)) {
                                const findCategory = await Category.findById({ _id: req.body.categoryId });
                                if (!findCategory) {
                                        return res.status(404).json({ message: "Category Not Found", status: 404, data: {} });
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
                                                userId: req.body.userId,
                                                categoryId: findCategory._id,
                                                couponCode: couponCode,
                                                amount: req.body.amount,
                                                expirationDate: expirationDate,
                                                activationDate: activationDate,
                                                image: fileUrl,
                                                type: "user",
                                                addBy: "Admin"
                                        }
                                        let saveStore = await offer(obj).save();
                                        if (saveStore) {
                                                res.json({ status: 200, message: 'offer add successfully.', data: saveStore });
                                        }
                                }
                        }
                        if (req.body.productId != (null || undefined)) {
                                const findProduct = await product.findById({ _id: req.body.productId });
                                if (!findProduct) {
                                        return res.status(404).json({ message: "Service Not Found", status: 404, data: {} });
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
                                                userId: req.body.userId,
                                                productId: findProduct._id,
                                                couponCode: couponCode,
                                                amount: req.body.amount,
                                                expirationDate: expirationDate,
                                                activationDate: activationDate,
                                                image: fileUrl,
                                                type: "user",
                                                addBy: "Admin"
                                        }
                                        let saveStore = await offer(obj).save();
                                        if (saveStore) {
                                                res.json({ status: 200, message: 'offer add successfully.', data: saveStore });
                                        }
                                }
                        }
                } else {
                        if (req.body.categoryId != (null || undefined)) {
                                const findCategory = await Category.findById({ _id: req.body.categoryId });
                                if (!findCategory) {
                                        return res.status(404).json({ message: "Category Not Found", status: 404, data: {} });
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
                                                categoryId: findCategory._id,
                                                couponCode: couponCode,
                                                amount: req.body.amount,
                                                expirationDate: expirationDate,
                                                activationDate: activationDate,
                                                image: fileUrl,
                                                type: "other",
                                                addBy: "Admin"
                                        }
                                        let saveStore = await offer(obj).save();
                                        if (saveStore) {
                                                res.json({ status: 200, message: 'offer add successfully.', data: saveStore });
                                        }
                                }
                        }
                        if (req.body.productId != (null || undefined)) {
                                const findProduct = await product.findById({ _id: req.body.productId });
                                if (!findProduct) {
                                        return res.status(404).json({ message: "Service Not Found", status: 404, data: {} });
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
                                                productId: findProduct._id,
                                                couponCode: couponCode,
                                                amount: req.body.amount,
                                                expirationDate: expirationDate,
                                                activationDate: activationDate,
                                                image: fileUrl,
                                                type: "other",
                                                addBy: "Admin"
                                        }
                                        let saveStore = await offer(obj).save();
                                        if (saveStore) {
                                                res.json({ status: 200, message: 'offer add successfully.', data: saveStore });
                                        }
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
                let findService = await offer.find({});
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
exports.refundPayment = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).json({ status: 404, message: "User not found" });
                } else {
                        let findOrder = await cancelReturnOrder.findOne({ _id: req.params.id });
                        if (!findOrder) {
                                return res.status(404).json({ message: "User not found.", status: 404, data: {} });
                        } else {
                                const orders = await order.findById({ _id: findOrder.Orders })
                                if (!orders) {
                                        return res.status(404).json({ status: 404, message: "Orders not found", data: {} });
                                }
                                if (orders.paymentStatus == "paid") {
                                        let userData1 = await User.findOne({ _id: findOrder.userId });
                                        if (!userData1) {
                                                return res.status(404).json({ status: 404, message: "User not found" });
                                        }
                                        let update = await User.findByIdAndUpdate({ _id: userData1._id }, { $set: { wallet: userData1.wallet + parseInt(orders.total) } }, { new: true });
                                        if (update) {
                                                let upda = await cancelReturnOrder.findByIdAndUpdate({ _id: findOrder._id }, { $set: { refundStatus: "paid" } }, { new: true });
                                                await order.findByIdAndUpdate({ _id: orders._id }, { $set: { refundStatus: "paid" } }, { new: true });
                                                let relatedPayments;
                                                if (orders.returnStatus == "return") {
                                                        relatedPayments = "Return Refund";
                                                }
                                                if (orders.returnStatus == "cancel") {
                                                        relatedPayments = "Cancellation Refund";
                                                }
                                                let obj = {
                                                        user: findOrder.userId,
                                                        date: Date.now(),
                                                        amount: orders.total,
                                                        type: "Credit",
                                                        relatedPayments: relatedPayments
                                                };
                                                const data1 = await transactionModel.create(obj);
                                                if (data1) {
                                                        return res.status(200).json({ status: 200, message: "Rufund payment successfully.", data: upda, });
                                                }
                                        }
                                } else {
                                        let userData1 = await User.findOne({ _id: findOrder.userId });
                                        if (!userData1) {
                                                return res.status(404).json({ status: 404, message: "User not found" });
                                        }
                                        let upda = await cancelReturnOrder.findByIdAndUpdate({ _id: findOrder._id }, { $set: { refundStatus: "paid" } }, { new: true });
                                        await order.findByIdAndUpdate({ _id: orders._id }, { $set: { refundStatus: "paid" } }, { new: true });
                                        return res.status(200).json({ status: 200, message: "Rufund payment successfully.", data: upda, });
                                }
                        }
                }
        } catch (error) {
                return res.status(500).send({ msg: "internal server error", error: error, });
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