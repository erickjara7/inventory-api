const express = require("express");

// Importar controlador y sus metodos
const {
  readBranch,
  createBranch,
  updateBranch,
  deleteBranch
} = require("../controllers/branches");

// Cargar router de express
const router = express.Router();

// Cargar middlewares para proteger y autorizar las rutas
const { protect, authorize } = require("../middlewares/authHandler");

// Rutear peticiones HTTP
router.get("/", protect, authorize("admin", "manager"), readBranch);
router.post("/", protect, authorize("admin"), createBranch);
router.put("/:id", protect, authorize("admin"), updateBranch);
router.delete("/:id", protect, authorize("admin"), deleteBranch);

module.exports = router;
