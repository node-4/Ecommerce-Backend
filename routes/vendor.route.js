const auth = require("../controllers/vendorController");
const user = require("../controllers/userController");
const authJwt = require("../middlewares/authJwt");
const { cpUpload0, upload, upload1, upload2, cpUpload, categoryUpload, subCategoryUpload } = require('../middlewares/imageUpload')
const express = require("express");
const router = express()
router.post("/vendor/registration", auth.registration);
router.post("/vendor/:id", auth.verifyOtp);
router.post("/vendor/login/WithPhone", auth.loginWithPhone);
router.post("/vendor/resendOtp/:id", auth.resendOTP);
router.get("/vendor/getProfile", authJwt.verifyToken, auth.getProfile);
router.post("/vendor/social/Login", auth.socialLogin);
router.post("/vendor/forgetPassword/:email", auth.forgetPassword);
router.post("/vendor/resetPassword/:email", auth.resetPassword);
router.post("/vendor/login/withPassword", auth.signin);
router.post('/vendor/QuantityUnit/add', authJwt.verifyToken, auth.addQuantityUnit);
router.get("/vendor/QuantityUnit/view/:id", auth.viewQuantityUnit);
router.put('/vendor/QuantityUnit/edit/:id', authJwt.verifyToken, auth.editQuantityUnit);
router.delete('/vendor/QuantityUnit/delete/:id', authJwt.verifyToken, auth.deleteQuantityUnit);
router.get('/vendor/QuantityUnit/list', authJwt.verifyToken, auth.listQuantityUnit);
router.post('/vendor/Color/add', authJwt.verifyToken, auth.addColor);
router.get("/vendor/Color/view/:id", auth.viewColor);
router.put('/vendor/Color/edit/:id', authJwt.verifyToken, auth.editColor);
router.delete('/vendor/Color/delete/:id', authJwt.verifyToken, auth.deleteColor);
router.get('/vendor/Color/list', authJwt.verifyToken, auth.listColor);
router.post('/vendor/Product/add', authJwt.verifyToken, upload.array('image'), auth.addProduct);
router.post('/vendor/ProductVarient/add', authJwt.verifyToken, auth.addProductVarient);
router.post('/vendor/ProductColor/add', authJwt.verifyToken, upload.array('image'), auth.addColorInProduct);
router.post('/vendor/VarientInColor/add', authJwt.verifyToken, auth.addVarientInColor);
module.exports = router;