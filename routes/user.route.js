const auth = require("../controllers/userController");
const authJwt = require("../middlewares/authJwt");
const { cpUpload0, upload, upload1, upload2, cpUpload, categoryUpload, subCategoryUpload } = require('../middlewares/imageUpload')
const express = require("express");
const router = express()
router.get('/User/Product/list', auth.listProduct);
module.exports = router;