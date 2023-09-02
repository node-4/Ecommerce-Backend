const auth = require("../controllers/adminController");
const authJwt = require("../middlewares/authJwt");
const express = require("express");
const router = express()
const { cpUpload0, upload, upload1, upload2, cpUpload, bannerUpload, categoryUpload, subCategoryUpload } = require('../middlewares/imageUpload')
router.post("/admin/registration", auth.registration);
router.post("/admin/login", auth.signin);
router.get("/admin/getProfile", [authJwt.verifyToken], auth.getProfile);
router.put("/admin/update", [authJwt.verifyToken], auth.update);
router.get("/admin/getAllUser", auth.getAllUser);
router.get("/admin/getAllVendor", auth.getAllVendor);
router.put("/admin/blockUnblockUser/:id", [authJwt.verifyToken], auth.blockUnblockUser);
router.get("/admin/viewUser/:id", [authJwt.verifyToken], auth.viewUser);
router.delete("/admin/:id", [authJwt.verifyToken], auth.deleteUser);
router.post("/Category/addCategory", [authJwt.verifyToken], auth.createCategory);
router.get("/Category/allCategory", auth.getCategories);
router.get("/Category/paginateCategoriesSearch", auth.paginateCategoriesSearch);
router.put("/Category/updateCategory/:id", [authJwt.verifyToken], auth.updateCategory);
router.delete("/Category/deleteCategory/:id", [authJwt.verifyToken], auth.removeCategory);
router.put("/Category/approvedRejectCategory/:id", [authJwt.verifyToken], auth.approvedRejectCategory);
router.post("/SubCategory/addSubcategory", [authJwt.verifyToken], subCategoryUpload.single('image'), auth.createSubCategory);
router.get("/SubCategory/:id", auth.getIdSubCategory);
router.put("/SubCategory/updateSubcategory/:id", [authJwt.verifyToken], subCategoryUpload.single('image'), auth.updateSubCategory);
router.delete("/SubCategory/deleteSubcategory/:id", [authJwt.verifyToken], auth.deleteSubCategory);
router.get("/SubCategory/all/Subcategory", auth.getSubCategory);
router.get("/SubCategory/all/SubCategoryForAdmin", auth.getSubCategoryForAdmin);
router.get("/SubCategory/paginate/SubCategoriesSearch", auth.paginateSubCategoriesSearch);
router.get("/SubCategory/allSubcategoryById/:categoryId", auth.getSubCategoryByCategoryId);
router.get("/admin/allTransactionUser", auth.allTransactionUser);
router.get("/admin/allcreditTransactionUser", auth.allcreditTransactionUser);
router.get("/admin/allDebitTransactionUser", auth.allDebitTransactionUser);
router.get("/admin/Orders", [authJwt.verifyToken], auth.getOrders);
router.post("/Banner/addBanner", [authJwt.verifyToken], bannerUpload.single('image'), auth.createBanner);
router.get("/Banner/getBanner", auth.getBanner);
router.get("/Banner/:id", auth.getIdBanner);
router.delete("/Banner/:id", [authJwt.verifyToken], auth.deleteBanner);
router.put("/Banner/updateBanner/:id", [authJwt.verifyToken], bannerUpload.single('image'), auth.updateBanner);
router.post("/help/addQuery", auth.addQuery);
router.get("/help/all", auth.getAllHelpandSupport);
router.get("/help/:id", auth.getHelpandSupportById);
router.delete("/help/:id", auth.deleteHelpandSupport);
router.post("/ContactDetails/addContactDetails", [authJwt.verifyToken], auth.addContactDetails);
router.get("/ContactDetails/viewContactDetails", auth.viewContactDetails);
router.post("/notification/sendNotification", authJwt.verifyToken, auth.sendNotification);
router.get("/notification/allNotification", authJwt.verifyToken, auth.allNotification);
router.post("/Coupan/addCoupan", [authJwt.verifyToken], auth.addCoupan);
router.get("/Coupan/listCoupan", [authJwt.verifyToken], auth.listCoupan);
router.delete("/Coupan/:id", [authJwt.verifyToken], auth.deleteHelpandSupport);
router.put("/kyc/vendorKycVerification", [authJwt.verifyToken], auth.vendorKycVerification);
router.get("/admin/KycList", [authJwt.verifyToken], auth.KycList);
router.get('/admin/Product/list', auth.listProduct);
router.delete('/admin/Product/delete/:id', authJwt.verifyToken, auth.deleteProduct);
router.get('/admin/listProductVarient', auth.listProductVarient);
router.get('/admin/dashboard', auth.dashboard);
router.get("/admin/getcancelReturnOrder", [authJwt.verifyToken], auth.getcancelReturnOrder);
router.put("/admin/acceptRejectCancelReturnOrder/:id", [authJwt.verifyToken], auth.acceptRejectCancelReturnOrder);
module.exports = router;