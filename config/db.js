const mongoose = require("mongoose");

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  });

  // Mostrar por consola la conexion exitosa y el host
  console.log(
    `MongoDB se ha conectado en el host: ${conn.connection.host}`.cyan.underline
      .bold
  );
};

// Hacer disponible la funcion en cualquier lugar de la aplicacion
module.exports = connectDB;
