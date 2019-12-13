// Middlewares y Utilidades
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/asyncHandler");
const isEmpty = require("../utils/isEmpty");

// Carga de los modelos a utilizar
const Parent = require("../models/Parent");
const Branch = require("../models/Branch");
const User = require("../models/User");

// @desc    Obtener sucursales
// @route   GET /api/v1/branches
// @access  Private [Admin, Manager]
exports.readBranch = asyncHandler(async (req, res, next) => {
  // Realizar lo siguiente si el usuario es administrador y esta asignado a una matriz
  if (req.user.role === "admin" && !isEmpty(req.user.parent)) {
    // Buscar sucursales donde la matriz sea la misma del administrador
    let branch = await Branch.find().where({ parent: req.user.parent });

    if (isEmpty(branch)) {
      return next(
        new ErrorResponse("No encontramos sucursales registradas.", 404)
      );
    }

    // Enviar respuesta
    res.status(200).json({ success: true, count: branch.length, data: branch });
  }

  if (req.user.role === "manager" && !isEmpty(req.user.branch)) {
    // Buscar sucursales donde el manager sea el usuario haciendo la peticion
    branch = await Branch.find().where({ manager: req.user.id });

    if (isEmpty(branch)) {
      return next(
        new ErrorResponse("No encontramos sucursales registradas.", 404)
      );
    }

    // Enviar respuesta
    res.status(200).json({ success: true, count: branch.length, data: branch });
  }
});

// @desc    Crear sucursal
// @route   POST /api/v1/branches
// @access  Private [Admin]
exports.createBranch = asyncHandler(async (req, res, next) => {
  // Buscar matriz en donde el usuario sea administrador
  const parent = await Parent.findOne().where({ admin: req.user.id });

  // Validar si el administrador tiene o no una matriz registrada
  if (isEmpty(parent)) {
    return next(
      new ErrorResponse(
        `No se encontro una matriz asignada a este usuario.`,
        404
      )
    );
  }

  // Campos a ingresar
  const newBranch = new Branch({
    parent: parent.id,
    name: req.body.name,
    address: {
      street: req.body.street,
      streetAditional: req.body.streetAditional,
      district: req.body.district,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      zipCode: req.body.zipCode
    },
    contact: {
      phone: req.body.phone,
      email: req.body.email
    }
  });

  // Creamos una nueva sucursal con los datos proporcionados
  const branch = await Branch.create(newBranch);

  // Agregar el ID de la sucursal al arreglo de sucursales en la matriz
  parent.branches.unshift(branch.id);
  parent.save();

  // Enviamos la respuesta
  res.status(201).json({
    success: true,
    data: branch
  });
});

// @desc    Editar sucursal
// @route   PUT /api/v1/branches/:id
// @access  Private [Admin]
exports.updateBranch = asyncHandler(async (req, res, next) => {
  // Buscar la sucursal mediante el ID
  let branch = await Branch.findById(req.params.id);

  // Validar que la sucursal exista
  if (isEmpty(branch)) {
    return next(new ErrorResponse(`No se encontró esa sucursal.`, 404));
  }

  // Validar que la sucursal a editar pertenezca al administrador
  if (req.user.parent.toString() !== branch.parent.toString()) {
    return next(
      new ErrorResponse(`Esta sucursal no pertenece a tu empresa.`, 401)
    );
  }

  // Campos a actualizar, inicializamos con los valores actuales en la BD
  let fieldsToUpdate = {
    name: branch.name,
    address: {
      street: branch.address.street,
      streetAditional: branch.address.streetAditional,
      district: branch.address.district,
      city: branch.address.city,
      state: branch.address.state,
      country: branch.address.country,
      zipCode: branch.address.zipCode
    },
    contact: {
      phone: branch.contact.phone,
      email: branch.contact.email
    }
  };

  // Condicionalmente cambiamos los valores de los campos si el usuario lo ingresa
  if (req.body.name) fieldsToUpdate.name = req.body.name;
  if (req.body.street) fieldsToUpdate.address.street = req.body.street;
  if (req.body.streetAditional)
    fieldsToUpdate.address.streetAditional = req.body.streetAditional;
  if (req.body.district) fieldsToUpdate.address.district = req.body.district;
  if (req.body.city) fieldsToUpdate.address.city = req.body.city;
  if (req.body.state) fieldsToUpdate.address.state = req.body.state;
  if (req.body.country) fieldsToUpdate.address.country = req.body.country;
  if (req.body.zipCode) fieldsToUpdate.address.zipCode = req.body.zipCode;
  if (req.body.phone) fieldsToUpdate.contact.phone = req.body.phone;
  if (req.body.email) fieldsToUpdate.contact.email = req.body.email;

  // Actualizar la sucursal
  branch = await Branch.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: false,
    projection: "name address contact"
  });

  // Enviar respuesta
  res.status(200).json({
    success: true,
    data: branch
  });
});

// @desc    Eliminar sucursal
// @route   DELETE /api/v1/branches/:id
// @access  Private [Admin]
exports.deleteBranch = asyncHandler(async (req, res, next) => {
  // Buscar la sucursal mediante el ID
  const branch = await Branch.findById(req.params.id);

  // Validar que la sucursal exista
  if (isEmpty(branch)) {
    return next(new ErrorResponse("La sucursal proporcionada no existe.", 404));
  }

  // Validar que la sucursal a editar pertenezca al administrador
  if (req.user.parent.toString() !== branch.parent.toString()) {
    return next(
      new ErrorResponse(`Esta sucursal no pertenece a tu empresa.`, 401)
    );
  }

  // Eliminar sucursal
  branch.remove();

  // Enviar respuesta
  res.status(200).json({ success: true, data: {} });
});
