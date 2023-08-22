const auth = require("../controllers/userController");
const authJwt = require("../middlewares/authJwt");
const { cpUpload0, upload, upload1, upload2, cpUpload, categoryUpload, subCategoryUpload } = require('../middlewares/imageUpload')
const express = require("express");
const router = express()

router.get("/user/allCategory/:gender", auth.getCategories);
router.get("/user/allSubcategoryById/:categoryId", auth.getSubCategoryByCategoryId);
router.get('/user/Product/list', auth.listProduct);
router.post("/cart/addtocart", authJwt.verifyToken, auth.addtocart);
router.get("/cart/getCart", authJwt.verifyToken, auth.getCart);
router.delete("/cart/deleteCart", authJwt.verifyToken, auth.deleteCart);
router.put("/cart/deletecartItem/:id", authJwt.verifyToken, auth.deletecartItem);
router.put("/cart/addAdressToCart", [authJwt.verifyToken], auth.addAdressToCart);
router.put("/cart/changePaymentOption", [authJwt.verifyToken], auth.changePaymentOption);
router.post("/cart/checkout", authJwt.verifyToken, auth.checkout);
router.post("/cart/placeOrder/:orderId", [authJwt.verifyToken], auth.placeOrder);
router.get("/order/allOrders", [authJwt.verifyToken], auth.getAllOrders);
router.get("/order/Orders", [authJwt.verifyToken], auth.getOrders);
router.get("/order/viewOrder/:id", [authJwt.verifyToken], auth.getOrderbyId);













module.exports = router;