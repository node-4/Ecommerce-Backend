const auth = require("../controllers/adminController");
const authJwt = require("../middlewares/authJwt");
const express = require("express");
const router = express()
const { cpUpload0, upload, upload1, upload2, cpUpload, categoryUpload, subCategoryUpload } = require('../middlewares/imageUpload')
router.post("/admin/registration", auth.registration);
router.post("/admin/login", auth.signin);
router.get("/admin/getProfile", [authJwt.verifyToken], auth.getProfile);
router.post("/Category/addCategory", [authJwt.verifyToken], auth.createCategory);
router.get("/Category/allCategory", auth.getCategories);
router.get("/Category/paginateCategoriesSearch", auth.paginateCategoriesSearch);
router.put("/Category/updateCategory/:id", [authJwt.verifyToken], auth.updateCategory);
router.delete("/Category/deleteCategory/:id", [authJwt.verifyToken], auth.removeCategory);
router.post("/SubCategory/addSubcategory", [authJwt.verifyToken], subCategoryUpload.single('image'), auth.createSubCategory);
router.get("/SubCategory/:id", auth.getIdSubCategory);
router.put("/SubCategory/updateSubcategory/:id", [authJwt.verifyToken], subCategoryUpload.single('image'), auth.updateSubCategory);
router.delete("/SubCategory/deleteSubcategory/:id", [authJwt.verifyToken], auth.deleteSubCategory);
router.get("/SubCategory/all/Subcategory", auth.getSubCategory);
router.get("/SubCategory/all/SubCategoryForAdmin", auth.getSubCategoryForAdmin);
router.get("/SubCategory/paginate/SubCategoriesSearch", auth.paginateSubCategoriesSearch);
router.get("/SubCategory/allSubcategoryById/:categoryId", auth.getSubCategoryByCategoryId);



module.exports = router;