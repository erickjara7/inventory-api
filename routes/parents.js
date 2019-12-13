const express = require("express");

// Importar controlador y sus metodos
const {
  readParent,
  createParent,
  updateParent,
  deleteParent
} = require("../controllers/parents");

// Cargar router de express
const router = express.Router();

// Cargar middlewares para proteger y autorizar las rutas
const { protect, authorize } = require("../middlewares/authHandler");

// Rutear peticiones HTTP
router.get("/", protect, authorize("admin"), readParent);
router.post("/", protect, authorize("admin"), createParent);
router.put("/", protect, authorize("admin"), updateParent);
router.delete("/", protect, authorize("admin"), deleteParent);

module.exports = router;
