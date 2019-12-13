const express = require("express");

// Importar controlador y sus metodos
const {
  me,
  register,
  login,
  logout,
  changePassword,
  forgotPassword,
  resetPassword
} = require("../controllers/auth");

// Cargar router de express
const router = express.Router();

// Cargar middlewares para proteger y autorizar las rutas
const { protect } = require("../middlewares/authHandler");

// Rutear peticiones HTTP
router.post("/me", protect, me);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.put("/changepassword", protect, changePassword);
router.put("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);

module.exports = router;
