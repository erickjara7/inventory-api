// Middlewares y Utilidades
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/asyncHandler");
const isEmpty = require("../utils/isEmpty");

// Carga de los modelos a utilizar
const Parent = require("../models/Parent");
const User = require("../models/User");

// @desc    Obtener matriz
// @route   GET /api/v1/parents
// @access  Private [Admin]
exports.readParent = asyncHandler(async (req, res, next) => {
  // Buscar matriz donde el campo administrador contenga el ID del usuario haciendo la peticion
  // Solo listar el nombre, direccion y contacto
  const parent = await Parent.find(
    { admin: req.user.id },
    "name address contact"
  );

  if (!isEmpty(parent)) {
    res.status(200).json({ success: true, data: parent });
  } else {
    return next(
      new ErrorResponse("No encontramos una matriz registrada.", 404)
    );
  }
});

// @desc    Crear matriz
// @route   POST /api/v1/parents
// @access  Private [Admin]
exports.createParent = asyncHandler(async (req, res, next) => {
  // Buscar matriz donde el campo administrador contenga el ID del usuario haciendo la peticion
  let parent = await Parent.findOne().where({ admin: req.user.id });

  // Si la query anterior retorna algun resultado, significa que el usuario ya ha registrado una matriz y no tiene permitido crear otra
  if (!isEmpty(parent)) {
    return next(new ErrorResponse(`Ya tienes una matriz registrada.`, 403));
  }

  // Datos a llenar
  const newParent = new Parent({
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
    },
    // El campo admin sera igual al ID del usuario haciendo la peticion
    admin: req.user.id
  });

  // Creamos una nueva matriz con los datos proporcionados
  parent = await Parent.create(newParent);

  // Buscamos al usuario que realiza la operacion mediante su ID
  const user = await User.findById(req.user.id);

  // Insertamos el ID de la matriz y se la asignamos al usuario y guardamos
  user.parent = newParent.id;
  user.save();

  // Enviamos la respuesta
  res.status(201).json({
    success: true,
    data: parent
  });
});

// @desc    Editar matriz
// @route   PUT /api/v1/parents
// @access  Private [Admin]
exports.updateParent = asyncHandler(async (req, res, next) => {
  // Buscar matriz a actualizar, en la cual el usuario haciendo la peticion debe ser administrador
  let parent = await Parent.findOne({ admin: req.user.id });

  // Validar que exista matriz
  if (isEmpty(parent)) {
    return next(new ErrorResponse("No tienes una matriz registrada.", 400));
  }

  // Campos a actualizar, inicializamos con los valores actuales en la BD
  let fieldsToUpdate = {
    name: parent.name,
    address: {
      street: parent.address.street,
      streetAditional: parent.address.streetAditional,
      district: parent.address.district,
      city: parent.address.city,
      state: parent.address.state,
      country: parent.address.country,
      zipCode: parent.address.zipCode
    },
    contact: {
      phone: parent.contact.phone,
      email: parent.contact.email
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

  // Actualizar matriz donde el usuario es administrador y pasamos el objecto 'fieldsToUpdate'
  parent = await Parent.findByIdAndUpdate(req.user.parent, fieldsToUpdate, {
    new: true,
    projection: "name address contact"
  });

  // Enviamos respuesta
  res.status(200).json({ success: true, data: parent });
});

// @desc    Eliminar matriz
// @route   DELETE /api/v1/parents
// @access  [Admin]
exports.deleteParent = asyncHandler(async (req, res, next) => {
  // Buscar matriz donde el campo administrador contenga el ID del usuario haciendo la peticion
  const parent = await Parent.findOne().where({ admin: req.user.id });

  // Validar que la matriz donde el usuario sea administrador exista
  if (isEmpty(parent)) {
    return next(
      new ErrorResponse(
        `No se encontro una matriz en la cual seas administrador.`,
        400
      )
    );
  }

  // Eliminamos la matriz
  parent.remove();

  // Enviamos respuesta
  res.status(200).json({ success: true, data: {} });
});
