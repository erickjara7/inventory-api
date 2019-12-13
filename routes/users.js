const express = require("express");

// Importar controlador y sus metodos
const {
  readSingleUser,
  readUsers,
  activateUser,
  deleteUser,
  createUser,
  assignUserToParent,
  unassignUserFromParent,
  assignUserToBranch,
  unassignUserFromBranch
} = require("../controllers/users");

// Cargar router de express
const router = express.Router();

// Cargar middlewares para proteger y autorizar las rutas
const { protect, authorize } = require("../middlewares/authHandler");

// Rutear peticiones HTTP
router.get("/", protect, authorize("admin", "manager"), readUsers);
router.get("/:id", protect, authorize("admin", "manager"), readSingleUser);
router.post("/", protect, authorize("admin", "manager"), createUser);
router.delete("/:id", protect, authorize("admin"), deleteUser);
router.put("/:id/activate", protect, authorize("admin"), activateUser);

router.put(
  "/:id/parents/:parentId/assign",
  protect,
  authorize("admin"),
  assignUserToParent
);

router.put(
  "/:id/parents/:parentId/unassign",
  protect,
  authorize("admin"),
  unassignUserFromParent
);

router.put(
  "/:id/branches/:branchId/assign",
  protect,
  authorize("admin", "manager"),
  assignUserToBranch
);

router.put(
  "/:id/branches/:branchId/unassign",
  protect,
  authorize("admin"),
  unassignUserFromBranch
);

module.exports = router;
