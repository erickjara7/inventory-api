const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Por favor, ingrese el nombre del producto."]
  },
  partNumber: {
    type: String,
    required: [true, "Por favor, ingrese el numero de parte."]
  },
  brand: {
    type: String,
    required: [true, "Por favor, ingrese la marca del producto."]
  },
  description: {
    type: String
  },
  weight: {
    type: Number
  },
  weightUnit: {
    type: String,
    enum: ["lb", "oz", "mg", "g", "kg", "t"]
  },
  initialStock: {
    type: Number,
    required: [true, "Por favor, ingrese el stock inicial."]
  },
  initialCost: {
    type: Number
  },
  buyPrice: {
    type: Number
  },
  retailPrice: {
    type: Number
  },
  wholesalePrice: {
    type: Number
  },
  tags: {
    type: [String],
    default: undefined
  },
  images: {
    type: [String],
    default: "no-image.jpg"
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parent"
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch"
  }
});

// Antes de eliminar un producto, realizar lo siguiente
ProductSchema.pre("remove", async function(next) {
  // Solo mostrar en consola si esta en modo desarrollo
  if (process.env.NODE_ENV === "development") {
    console.log(
      `Todas las referencias a '${this.name}' con el ID '${this._id}' estan siendo eliminadas.`
    );
  }

  // Realizar solo si esta asignado el producto a una matriz
  if (this.parent !== undefined) {
    await this.model("Parent").findByIdAndUpdate(
      { _id: this.parent },
      { $pull: { products: this._id } }
    );
  }

  // Realizar solo si esta asignado el producto a una sucursal
  if (this.branch !== undefined) {
    await this.model("Branch").findByIdAndUpdate(
      { _id: this.branch },
      { $pull: { products: this._id } }
    );
  }

  next();
});

module.exports = mongoose.model("Product", ProductSchema);
