const mongoose = require("mongoose");

const ParentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Por favor, ingrese el nombre de la matriz."]
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
  branches: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch"
    }
  ],
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

// Eliminar en cascada los usuarios y las sucursales cuando se elimine la matriz
ParentSchema.pre("remove", async function(next) {
  // Solo mostrar en consola si esta en modo desarrollo
  if (process.env.NODE_ENV === "development") {
    console.log(
      `Los usuarios, productos y sucursales vinculados con la matriz '${this.name}' estan siendo eliminados.`
    );
  }

  // Si existen sucursales eliminarlas asi como sus productos y usuarios
  if (this.branches !== undefined) {
    // Eliminar usuarios y productos que esten asignados a las sucursales de la matriz
    for (let i = 0; i < this.branches.length; i++) {
      await this.model("User").deleteMany({ branch: this.branches[i] });
      await this.model("Product").deleteMany({ branch: this.branches[i] });
    }

    // Eliminar todas las sucursales asignadas a la matriz
    await this.model("Branch").deleteMany({ parent: this._id });
  }

  // Eliminar usuarios y productos asignados a la sucursal
  await this.model("User").deleteMany({ parent: this._id });
  await this.model("Product").deleteMany({ parent: this._id });

  next();
});

module.exports = mongoose.model("Parent", ParentSchema);
