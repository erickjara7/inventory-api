const fs = require("fs");
const mongoose = require("mongoose");
const colors = require("colors");
const dotenv = require("dotenv");

// Cargar variables de entorno
dotenv.config({ path: "./config/config.env" });

// Cargar modelos
const User = require("./models/User");
const Branch = require("./models/Branch");
const Parent = require("./models/Parent");
const Product = require("./models/Product");

// Conectarse a la base de datos
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
});

// Leer archivos JSON
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/users.json`, "utf-8")
);

const branches = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/branches.json`, "utf-8")
);

const parents = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/parents.json`, "utf-8")
);

const products = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/products.json`, "utf-8")
);

// Importar los datos hacia la BD
const importData = async () => {
  try {
    await User.create(users);
    await Branch.create(branches);
    await Parent.create(parents);
    await Product.create(products);
    console.log("Los datos han sido importados...".green.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

// Eliminar los datos de la BD
const deleteData = async () => {
  try {
    await User.deleteMany();
    await Branch.deleteMany();
    await Parent.deleteMany();
    await Product.deleteMany();
    console.log("Los datos han sido eliminados...".red.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

// Acciones dependiendo lo que escribamos en consola "node seeder -i o node seeder -d" siendo el argumento [2] la -i o -d
if (process.argv[2] === "-i") {
  importData();
} else if (process.argv[2] === "-d") {
  deleteData();
}
