const ErrorResponse = require("../utils/errorResponse");

const errorHandler = (err, req, res, next) => {
  // Obtener todas las propiedades del error y lo guardamos en una variable
  let error = { ...err };

  error.message = err.message;

  // Registro de errores por consola (desarrollo)
  if (process.env.NODE_ENV === "development") {
    console.log(err);
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = `Recurso no encontrado.`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = `Recurso ya existe.`;
    error = new ErrorResponse(message, 409);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Error del Servidor"
  });
};

module.exports = errorHandler;
