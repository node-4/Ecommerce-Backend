const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authConfig = require("../configs/auth.config");
const User = require("../models/userModel");
const Category = require("../models/categoryModel");
const subCategory = require("../models/subCategoryModel");
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
exports.createCategory = async (req, res) => {
        try {
                let findCategory = await Category.findOne({ name: req.body.name, gender: req.body.gender });
                if (findCategory) {
                        return res.status(409).json({ message: "category already exit.", status: 404, data: {} });
                } else {
                        const data = { name: req.body.name, gender: req.body.gender };
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
        res.status(200).json({ status: 200, message: "Category data found.", data: categories });
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
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) {
                return res.status(404).json({ message: "Category Not Found", status: 404, data: {} });
        }
        category.gender = req.body.gender || category.gender;
        category.name = req.body.name || category.name;
        let update = await category.save();
        res.status(200).json({ status: 200, message: "Updated Successfully", data: update });
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
                const subcategoryCreated = await subCategory.create({ name: req.body.name, image: image, categoryId: data._id });
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
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).json({ status: 200, message: "Sub Category data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};