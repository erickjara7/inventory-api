const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Por favor, ingrese su nombre."]
  },
  email: {
    type: String,
    required: [true, "Por favor, ingrese su correo electronico."],
    unique: true,
    match: [
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Por favor, ingrese un correo electrónico con el formato: sunombre@ejemplo.com"
    ]
  },
  password: {
    type: String,
    required: [true, "Por favor, ingrese una contraseña."],
    minlength: 6,
    select: false // Establece que no se pueden hacer consultas a este campo en la base de datos
  },
  role: {
    type: String,
    enum: ["admin", "manager", "publisher", "norole"],
    default: "admin"
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parent"
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch"
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
});

// Encriptar la contraseña utilizando BCRYPT antes de guardar en la base de datos
UserSchema.pre("save", async function(next) {
  // Solo ejecutar el resto del middleware si la contraseña es modificada
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Antes de eliminar un usuario, realizar lo siguiente
UserSchema.pre("remove", async function(next) {
  // Solo mostrar en consola si esta en modo desarrollo
  if (process.env.NODE_ENV === "development") {
    console.log(
      `Todas las referencias a '${this.name}' con el ID '${this._id}' estan siendo eliminadas.`
    );
  }

  // Realizar solo si esta asignado el usuario a una matriz
  if (this.parent !== undefined) {
    await this.model("Parent").findByIdAndUpdate(
      { _id: this.parent },
      { $pull: { users: this._id } }
    );
  }

  // Realizar solo si esta asignado el producto a una sucursal
  if (this.branch !== undefined) {
    await this.model("Branch").findByIdAndUpdate(
      { _id: this.branch },
      { $pull: { users: this._id } }
    );
  }

  next();
});

// Firmar y retornar JWT
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Igualar la contraseña en texto plano que ingreso el usuario con la contraseña encriptada hasheada en la base de datos
UserSchema.methods.matchPassword = async function(plainPassword) {
  return await bcrypt.compare(plainPassword, this.password);
};

// Match user entered password to hashed encrypted password in db
UserSchema.methods.matchPassword = async function(plainPassword) {
  return await bcrypt.compare(plainPassword, this.password);
};

// Generar y hashear token de contraseña
UserSchema.methods.getResetPasswordToken = function() {
  // Generar token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hashear token y asignarlo al campo resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Establecer fecha de expiracion para el token
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // Tiempo de 10 minutos

  return resetToken;
};

module.exports = mongoose.model("User", UserSchema);
