// Dependencias
const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const colors = require("colors");
const fileupload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");

// Middlewares y Utilidades
const errorHandler = require("./middlewares/errorHandler");

// Configuracion de la base de datos
const connectDB = require("./config/db");

// Cargar las variables de entorno
dotenv.config({ path: "./config/config.env" });

// Conectar a la base de datos
connectDB();

// Archivos a rutear
const products = require("./routes/products");
const auth = require("./routes/auth");
const parents = require("./routes/parents");
const branches = require("./routes/branches");
const users = require("./routes/users");

// Inicializar la aplicacion
const app = express();

// Middleware de log para desarrollo
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Permitir la carga de archivos
app.use(fileupload());

// Express Body-Parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Sanitize data (prevent MongoDB Operator Injection)
app.use(mongoSanitize());

// Establecer headers de seguridad
app.use(helmet());

// Previnir ataques XSS (Cross-site Scripting)
app.use(xss());

// Limitar peticiones realizadas por usuario
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // Se reinicia cada 10 minutos el contador
  max: 150 // 150 peticiones
});

app.use(limiter);

// Prevenir polucion (http params)
app.use(hpp());

// Activar CORS
app.use(cors());

// Establecer carpeta estatica
app.use(express.static(path.join(__dirname, "public")));

// TODO: Montar ruteadores
app.use("/api/v1/products", products);
app.use("/api/v1/auth", auth);
app.use("/api/v1/parents", parents);
app.use("/api/v1/branches", branches);
app.use("/api/v1/users", users);

// Gestor de errores
app.use(errorHandler);

// Iniciar el puerto
const PORT = process.env.PORT || 5000;

// Iniciar el servidor
const server = app.listen(
  PORT,
  console.log(
    `El servidor esta corriendo en modo ${process.env.NODE_ENV} en el puerto ${PORT}`
      .yellow.bold.underline
  )
);

// Gestionar 'unhandled promise rejections' debido a que se usa async/await
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);

  // Cerrar el servidor y terminar el proceso
  server.close(() => process.exit(1));
});
