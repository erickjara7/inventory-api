const jwt = require("jsonwebtoken");
const asyncHandler = require("../middlewares/asyncHandler");
const ErrorResponse = require("../utils/errorResponse");

const User = require("../models/User");

// Proteger las rutas
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Establecer token desde el Bearer token en el header Authorization
    // EJEMPLO: Bearer eyJhbGciOiJIUzI -> [Bearer, eyJhbGciOiJIUzI]
    token = req.headers.authorization.split(" ")[1];

    // Establecer el token desde las cookies
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Validar que el token existe
  if (!token) {
    return next(
      new ErrorResponse("No estas autorizado para acceder a esta ruta.", 401)
    );
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Registro del token ({id, iat, exp}) por consola (desarrollo)
    if (process.env.NODE_ENV === "development") {
      console.log(decoded);
    }

    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return next(
      new ErrorResponse("No estas autorizado para acceder a esta ruta.", 401)
    );
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Su rol de usuario actual no esta autorizado para acceder a esta ruta.`,
          403
        )
      );
    }
    next();
  };
};
