const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authConfig = require("../configs/auth.config");
const User = require("../models/userModel");
const Category = require("../models/categoryModel");
const subCategory = require("../models/subCategoryModel");
const transactionModel = require("../models/transactionModel");
const order = require("../models/order/orderModel");
const banner = require("../models/banner");
const helpandSupport = require("../models/helpAndSupport");
const contact = require("../models/contactDetail");
const notification = require("../models/notification");
const Coupan = require('../models/Coupan')
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
                const category = await Category.findById(id);
                if (!category) {
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
                return res.status(200).json({ status: 200, message: "Updated Successfully", data: update });
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
                data = {
                        desc: req.body.desc,
                        image: bannerImage,
                };
                const Banner = await banner.create(data);
                return res.status(200).json({ message: "Banner add successfully.", status: 200, data: Banner });
        } catch (error) {
                return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
        }
};
exports.getBanner = async (req, res) => {
        try {
                const data = await banner.find({})
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
                                let userData = await User.find({ role: req.body.sendTo });
                                if (userData.length == 0) {
                                        return res.status(404).json({ status: 404, message: "Employee not found" });
                                } else {
                                        for (let i = 0; i < userData.length; i++) {
                                                let obj = {
                                                        userId: userData[i]._id,
                                                        title: req.body.title,
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
                                let userData = await User.findById({ _id: req.body._id, role: req.body.sendTo });
                                if (!userData) {
                                        return res.status(404).json({ status: 404, message: "Employee not found" });
                                } else {
                                        let obj = {
                                                userId: userData._id,
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
                        let findNotification = await notification.find({ userId: admin._id }).populate('userId');
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
                await Coupan.deleteOne({ _id: req.params.id });
                return res.status(200).json({ message: "Coupan  delete.", status: 200, data: {} });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error", error: err.message, });
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