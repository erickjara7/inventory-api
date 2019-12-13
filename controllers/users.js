const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/asyncHandler");
const isEmpty = require("../utils/isEmpty");

const User = require("../models/User");
const Branch = require("../models/Branch");
const Parent = require("../models/Parent");

// @desc    Listar un usuario
// @route   GET /api/v1/users/:id
// @access  Private [Admin, Manager]
exports.readSingleUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (isEmpty(user)) {
    return next(new ErrorResponse("No existe ese usuario.", 404));
  }

  res.status(200).json({ success: true, data: user });
});

// @desc    Listar usuarios por matriz o sucursal
// @route   GET /api/v1/users
// @access  Private [Admin, Manager]
exports.readUsers = asyncHandler(async (req, res, next) => {
  if (req.user.role === "admin" && !isEmpty(req.user.parent)) {
    // Buscar la matriz donde el usuario sea administrador
    const parent = await Parent.findOne().where({ admin: req.user.id });

    // Obtener todos los usuarios donde se cumpla alguna de las siguientes condiciones:
    // 1. Su ID se encuentre en el array de usuarios de la matriz (esten asignados a la matriz)
    // 2. Su campo 'branch' se encuentre en el array de sucursales de la matriz (el usuario esta asignado a una sucursal que pertenece a la matriz)
    let users = await User.find({
      $or: [{ _id: parent.users }, { branch: parent.branches }]
    }).populate("parent branch", "name");

    // Verificar que se obtuvieron usuarios
    if (isEmpty(users)) {
      return next(
        new ErrorResponse(
          "No se encontraron usuarios asignados a tu matriz o sucursales.",
          404
        )
      );
    }

    // Enviar respuesta
    res.status(200).json({ success: true, count: users.length, data: users });
  }

  if (req.user.role === "manager" && !isEmpty(req.user.branch)) {
    // Buscar la matriz donde el usuario sea gerente
    const branch = await Branch.findOne().where({ manager: req.user.id });

    // Obtener usuarios donde su ID se encuentre en el array de usuarios de la sucursal (que esten asignados a la sucursal)
    users = await User.find()
      .where("_id")
      .in(branch.users)
      .exec();

    // Verificar que se obtuvieron usuarios
    if (isEmpty(users)) {
      return next(
        new ErrorResponse(
          "No se encontraron usuarios asignados a tu sucursal.",
          404
        )
      );
    }

    // Enviar respuesta
    res.status(200).json({ success: true, count: users.length, data: users });
  }
});

// @desc    Crear un usuario
// @route   POST /api/v1/users
// @access  Private [Admin, Manager]
exports.createUser = asyncHandler(async (req, res, next) => {
  // Campos a ingresar
  let { name, email, password, passwordConfirm, role, active } = req.body;

  // Buscar al usuario en la base de datos mediante su correo
  let user = await User.findOne({ email: req.body.email });

  // Validar que el usuario no exista previamente en la BD
  if (!isEmpty(user)) {
    return next(
      new ErrorResponse(
        `El correo electronico que ingresaste ya existe en nuestros registros.`,
        400
      )
    );
  }

  // Validar que la contraseña y su confirmacion coinciden
  if (password !== passwordConfirm) {
    return next(new ErrorResponse(`Las contraseñas no coinciden.`, 400));
  }

  // Si se trata de ingresar el rol de administrador se retorna un error
  if (role === "admin") {
    return next(new ErrorResponse("No puedes crear administradores.", 401));
  }

  // Crear el usuario
  user = await User.create({
    name,
    email,
    password,
    role,
    active
  });

  // Enviar respuesta
  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Activar o desactivar usuario
// @route   PUT /api/v1/users/:id/activate
// @access  Private [Admin, Manager]
exports.activateUser = asyncHandler(async (req, res, next) => {
  // Buscar al usuario mediante el ID en la URL
  const user = await User.findById(req.params.id);

  // Validar que el usuario exista
  if (isEmpty(user)) {
    return next(new ErrorResponse("El usuario no existe.", 401));
  }

  // Si el campo parent y branch estan vacios entonces el usuario no esta asignado aun
  if (isEmpty(user.parent) && isEmpty(user.branch)) {
    return next(
      new ErrorResponse(
        "Debes asignar al usuario antes de poder activarlo.",
        400
      )
    );
  }

  // Validar que el rol del usuario a activar o desactivar no sea de un administrador
  if (user.role === "admin") {
    return next(new ErrorResponse("No puedes realizar esta accion.", 401));
  }

  // Cambiar estado del usuario condicionalmente
  if (user.active === true) {
    user.active = false;

    res.status(200).json({
      success: true,
      data: user
    });
  } else {
    user.active = true;

    res.status(200).json({
      success: true,
      data: user
    });
  }

  // Guardar usuario
  user.save();
});

// @desc    Asignar usuario a una matriz
// @route   PUT /api/v1/users/:id/parents/:parentId/assign
// @access  Private [Admin]
exports.assignUserToParent = asyncHandler(async (req, res, next) => {
  // Buscar al usuario mediante su ID
  const user = await User.findById(req.params.id);

  // Buscar la matriz mediante su ID
  const parent = await Parent.findById(req.params.parentId);

  // Validar que el usuario exista
  if (isEmpty(user)) {
    return next(new ErrorResponse("Ese usuario no existe.", 404));
  }

  // Validar que la matriz exista
  if (isEmpty(parent)) {
    return next(new ErrorResponse("Esa matriz no existe.", 404));
  }

  // Verificar que el rol del usuario a asignar no sea un administrador o gerente (sucursales)
  if (user.role === "admin" || user.role === "manager") {
    return next(new ErrorResponse("No puedes asignar a ese usuario.", 401));
  }

  // Encontrar el indice del usuario en el array usuarios de la matriz
  const index = parent.users.map(item => item._id.toString()).indexOf(user._id);

  if (index >= 0 && parent.users[index].toString() === user.id) {
    return next(
      new ErrorResponse(
        "El usuario indicado ya esta asignado a esta matriz.",
        400
      )
    );
  } else if (!isEmpty(user.parent) || !isEmpty(user.branch)) {
    return next(
      new ErrorResponse(
        "Este usuario ya esta asignado a otra matriz o sucursal.",
        400
      )
    );
  } else {
    // Agregar el ID de la matriz en el campo 'parent' del usuario y guardar cambios en el usuario
    user.parent = parent.id;
    user.save();

    // Agregar el ID del usuario en el array usuarios de la matriz y guardar cambios en la matriz
    parent.users.unshift(user.id);
    parent.save();

    // Enviar respuesta
    res.status(200).json({
      success: true,
      data: parent
    });
  }
});

// @desc    Desasignar usuario de una matriz
// @route   PUT /api/v1/users/:id/parents/:parentId/unassign
// @access  Private [Admin]
exports.unassignUserFromParent = asyncHandler(async (req, res, next) => {
  // Buscar al usuario mediante su ID
  const user = await User.findById(req.params.id);

  // Buscar la matriz mediante su ID
  const parent = await Parent.findById(req.params.parentId);

  // Validar que el usuario exista
  if (isEmpty(user)) {
    return next(new ErrorResponse("Ese usuario no existe.", 404));
  }

  // Validar que la matriz exista
  if (isEmpty(parent)) {
    return next(new ErrorResponse("Esa matriz no existe.", 404));
  }

  // Verificar que el rol del usuario a desasignar no sea un administrador o gerente (sucursales)
  if (user.role === "admin" || user.role === "manager") {
    return next(new ErrorResponse("No puedes desasignar a ese usuario.", 401));
  }

  // Encontrar el indice del usuario en el array usuarios de la matriz
  const index = parent.users.map(item => item._id.toString()).indexOf(user._id);

  if (index >= 0 && parent.users[index].toString() === user.id) {
    // Remover el campo 'parent' que contiene el ID de la matriz y guardar cambios en el usuario
    user.parent = undefined;
    user.save();

    // Remover el ID del usuario mediante su indice del array de usuarios en la matriz y guardar cambios en la matriz
    parent.users.splice(index, 1);
    parent.save();

    res.status(200).json({ success: true, data: parent });
  } else if (index < 0) {
    return next(
      new ErrorResponse(
        "El usuario no se encuentra asignado a esta matriz.",
        400
      )
    );
  }
});

// @desc    Asignar usuario a una sucursal
// @route   PUT /api/v1/users/:id/branches/:branchId/assign
// @access  Private [Admin, Manager]
exports.assignUserToBranch = asyncHandler(async (req, res, next) => {
  // Buscar al usuario mediante su ID
  const user = await User.findById(req.params.id);

  // Buscar la sucursal mediante su ID
  const branch = await Branch.findById(req.params.branchId);

  // Validar que el usuario exista
  if (isEmpty(user)) {
    return next(new ErrorResponse("Ese usuario no existe.", 404));
  }

  // Validar que la sucursal exista
  if (isEmpty(branch)) {
    return next(new ErrorResponse("Esa sucursal no existe.", 404));
  }

  // Verificar que el rol del usuario a asignar no sea un administrador o gerente (sucursales)
  if (user.role === "admin" || user.role === "manager") {
    return next(new ErrorResponse("No puedes asignar a ese usuario.", 401));
  }

  // Encontrar el indice del usuario en el array usuarios de la sucursal
  const index = branch.users.map(item => item._id.toString()).indexOf(user._id);

  if (index >= 0 && branch.users[index].toString() === user.id) {
    return next(
      new ErrorResponse(
        "El usuario indicado ya esta asignado a esta sucursal.",
        400
      )
    );
  } else if (!isEmpty(user.parent) || !isEmpty(user.branch)) {
    return next(
      new ErrorResponse(
        "Este usuario ya esta asignado a otra matriz o sucursal.",
        400
      )
    );
  } else {
    // Agregar el ID de la sucursal en el campo 'branch' del usuario y guardar cambios en el usuario
    user.branch = branch.id;
    user.save();

    // Agregar el ID del usuario en el array usuarios de la sucursal y guardar cambios en la sucursal
    branch.users.unshift(user.id);
    branch.save();

    // Enviar respuesta
    res.status(200).json({
      success: true,
      data: branch
    });
  }
});

// @desc    Desasignar usuario de una sucursal
// @route   PUT /api/v1/users/:id/branches/:branchId/unassign
// @access  Private [Admin, Manager]
exports.unassignUserFromBranch = asyncHandler(async (req, res, next) => {
  // Buscar al usuario mediante su ID
  const user = await User.findById(req.params.id);

  // Buscar la sucursal mediante su ID
  const branch = await Branch.findById(req.params.branchId);

  // Validar que el usuario exista
  if (isEmpty(user)) {
    return next(new ErrorResponse("Ese usuario no existe.", 404));
  }

  // Validar que la sucursal exista
  if (isEmpty(branch)) {
    return next(new ErrorResponse("Esa sucursal no existe.", 404));
  }

  // Verificar que el rol del usuario a desasignar no sea un administrador o gerente (sucursales)
  if (user.role === "admin" || user.role === "manager") {
    return next(new ErrorResponse("No puedes desasignar a ese usuario.", 401));
  }

  // Encontrar el indice del usuario en el array usuarios de la sucursal
  const index = branch.users.map(item => item._id.toString()).indexOf(user._id);

  if (index >= 0 && branch.users[index].toString() === user.id) {
    // Remover el campo 'branch' que contiene el ID de la sucursal y guardar cambios en el usuario
    user.branch = undefined;
    user.save();

    // Remover el ID del usuario mediante su indice del array de usuarios en la sucursal y guardar cambios en la sucursal
    branch.users.splice(index, 1);
    branch.save();

    res.status(200).json({ success: true, data: branch });
  } else if (index < 0) {
    return next(
      new ErrorResponse(
        "El usuario no se encuentra asignado a esta sucursal.",
        400
      )
    );
  }
});

// @desc    Eliminar usuario
// @route   DELETE /api/v1/users/:id
// @access  Private [Admin]
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  // Validar que el usuario exista
  if (!user) {
    return next(new ErrorResponse("El usuario no existe.", 400));
  }

  // Validar que el rol del usuario a eliminar no sea de administrador
  if (user.role === "admin") {
    return next(new ErrorResponse("No puedes realizar esta accion.", 401));
  }

  // Validar que el usuario pertenezca a la matriz o sucursal del usuario realizando la peticion
  if (
    !isEmpty(user.parent) &&
    req.user.parent.toString() !== user.parent.toString()
  ) {
    return next(
      new ErrorResponse("Este usuario no pertenece a tu matriz.", 401)
    );
  }

  if (
    !isEmpty(user.branch) &&
    req.user.branch.toString() !== user.branch.toString()
  ) {
    return next(
      new ErrorResponse("Este usuario no pertenece a tu sucursal.", 401)
    );
  }

  // Eliminar el usuario
  user.remove();

  // Enviar respuesta exitosa
  res.status(200).json({
    success: true,
    data: {}
  });
});
