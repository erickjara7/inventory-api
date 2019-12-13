const mongoose = require("mongoose");

const BranchSchema = new mongoose.Schema({
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parent"
  },
  name: {
    type: String,
    required: [true, "Por favor, ingrese el nombre de la sucursal."]
  },
  address: {
    street: {
      type: String,
      required: [true, "Por favor, ingrese el nombre de la calle."]
    },
    streetAditional: {
      type: String
    },
    district: {
      type: String,
      required: [true, "Por favor, ingrese una colonia."]
    },
    city: {
      type: String,
      required: [true, "Por favor, ingrese una ciudad."]
    },
    state: {
      type: String,
      required: [true, "Por favor, ingrese un estado."]
    },
    country: {
      type: String,
      required: [true, "Por favor, ingrese un pais."]
    },
    zipCode: {
      type: String,
      required: [true, "Por favor, ingrese el codigo postal."]
    }
  },
  contact: {
    phone: {
      type: Number
    },
    email: {
      type: String,
      match: [
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Por favor, ingrese un correo electrónico con el formato: sunombre@ejemplo.com"
      ]
    }
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }
  ],
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

// Antes de eliminar una sucursal, realizar lo siguiente
BranchSchema.pre("remove", async function(next) {
  // Solo mostrar en consola si esta en modo desarrollo
  if (process.env.NODE_ENV === "development") {
    console.log(
      `Todas las referencias a '${this.name}' con el ID '${this._id}' estan siendo eliminadas.`
    );
  }

  // Buscar por ID y actualizar el modelo 'Parent'
  await this.model("Parent").findByIdAndUpdate(
    // Donde el ID sea igual al campo parent de este modelo
    { _id: this.parent },
    // Remover del array 'branches' del modelo 'Parent' donde el ID sea igual a this.id
    { $pull: { branches: this._id } }
  );

  // Buscar por ID y eliminar productos y usuarios relacionados con esta sucursal
  await this.model("Product").deleteMany({ branch: this._id });
  await this.model("User").deleteMany({ branch: this._id });

  next();
});

module.exports = mongoose.model("Branch", BranchSchema);
