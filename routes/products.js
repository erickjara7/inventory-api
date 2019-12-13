const express = require("express");

// Importar controlador y sus metodos
const {
  readSingleProduct,
  readProducts,
  createProduct,
  updateProduct,
  productPhotoUpload,
  deleteProduct
} = require("../controllers/products");

// Cargar router de express
const router = express.Router();

// Cargar middlewares para proteger y autorizar las rutas
const { protect, authorize } = require("../middlewares/authHandler");

// Rutear peticiones HTTP
router.get(
  "/",
  protect,
  authorize("admin", "manager", "publisher"),
  readProducts
);

router.get(
  "/:id",
  protect,
  authorize("admin", "manager", "publisher"),
  readSingleProduct
);

router.post(
  "/",
  protect,
  authorize("admin", "manager", "publisher"),
  createProduct
);

router.put(
  "/:id",
  protect,
  authorize("admin", "manager", "publisher"),
  updateProduct
);

router.put(
  "/:id/photo",
  protect,
  authorize("admin", "manager", "publisher"),
  productPhotoUpload
);

router.delete(
  "/:id",
  protect,
  authorize("admin", "manager", "publisher"),
  deleteProduct
);

module.exports = router;
