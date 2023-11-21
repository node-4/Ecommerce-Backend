const auth = require("../controllers/vendorController");
const user = require("../controllers/userController");
const authJwt = require("../middlewares/authJwt");
const { cpUpload0, upload, upload1, upload2, cpUpload, kpUpload, categoryUpload, offerUpload, subCategoryUpload } = require('../middlewares/imageUpload')
const express = require("express");
const router = express()
router.post("/vendor/registration", auth.registration);
router.post("/vendor/loginwithphone", auth.loginwithphone);
router.post("/vendor/:id", auth.verifyOtp);
router.post("/vendor/resendOtp/:id", auth.resendOTP);
router.get("/vendor/getProfile", authJwt.verifyToken, auth.getProfile);
router.post("/vendor/social/Login", auth.socialLogin);
router.post("/vendor/forgetPassword", auth.forgetPassword);
router.post("/vendor/resetPassword", auth.resetPassword);
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
router.get('/vendor/Product/view/:id', auth.viewProduct);
router.get('/vendor/Product/list', authJwt.verifyToken, auth.listProduct);
router.put('/vendor/Product/edit/:id', authJwt.verifyToken, upload.array('image'), auth.editProduct);
router.delete('/vendor/Product/delete/:id', authJwt.verifyToken, auth.deleteProduct);
router.post('/vendor/ProductVarient/add', authJwt.verifyToken, auth.addProductVarient);
router.get('/vendor/ProductVarient/view/:id', auth.viewProductVarient);
router.put('/vendor/ProductVarient/edit/:id', authJwt.verifyToken, auth.editProductVarient);
router.put('/vendor/ProductVarient/uploadImage/:id', authJwt.verifyToken, upload.array('image'), auth.uploadImageInVarient);
router.delete('/vendor/ProductVarient/delete/:id', authJwt.verifyToken, auth.deleteProductVarient);
router.get('/vendor/ProductVarient/list', authJwt.verifyToken, auth.listProductVarient);
router.post('/vendor/ProductColor/add', authJwt.verifyToken, upload.array('image'), auth.addColorInProduct);
router.put('/vendor/ProductColor/edit/:id', authJwt.verifyToken, upload.array('image'), auth.editColorInProduct);
router.post('/vendor/VarientInColor/add', authJwt.verifyToken, auth.addVarientInColor);
router.put('/vendor/VarientInColor/edit/:id', authJwt.verifyToken, auth.editVarientInColor);
router.delete('/vendor/VarientInColor/delete/:id', authJwt.verifyToken, auth.deleteVarientInColor);
router.delete('/vendor/VarientInColor/deleteImage/:id', authJwt.verifyToken, auth.deleteImagefromVarient);
router.get("/vendor/Orders", [authJwt.verifyToken], auth.getOrders);
router.post("/kyc/addKYC", [authJwt.verifyToken], cpUpload, auth.addKYC);
router.get("/kyc/KycList", [authJwt.verifyToken], auth.KycList);
router.post("/kyc/addKYB", [authJwt.verifyToken], kpUpload, auth.addKYB);
router.get("/kyc/KybList", [authJwt.verifyToken], auth.KybList);
router.get("/vendor/getcancelReturnOrder", [authJwt.verifyToken], auth.getcancelReturnOrder);
router.post("/vendor/Offer/addOffer", [authJwt.verifyToken], offerUpload.single('image'), auth.addOffer);
router.get("/vendor/Offer/listOffer", [authJwt.verifyToken], auth.listOffer);
router.get('/vendor/dashboard', [authJwt.verifyToken], auth.dashboard);
router.put("/order/changeOrderStatus/:id", [authJwt.verifyToken], auth.changeOrderStatus);
module.exports = router;