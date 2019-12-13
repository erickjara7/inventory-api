// Middlewares y Utilidades
const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/asyncHandler");
const sendEmail = require("../utils/sendEmail");
const sendTokenResponse = require("../utils/tokenResponse");

// Carga de los modelos a utilizar
const User = require("../models/User");

// @desc      Obtener el usuario actual (con sesion iniciada)
// @route     GET /api/v1/auth/me
// @access    Private
exports.me = asyncHandler(async (req, res, next) => {
  // Obtener el ID del usuario que hace la peticion
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Registrar usuario
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;

  let user = await User.findOne({ email: req.body.email });

  if (user) {
    return next(
      new ErrorResponse(
        `El correo electronico que ingresaste ya existe en nuestros registros.`,
        400
      )
    );
  }

  // El usuario debe confirmar la contraseña
  if (password !== passwordConfirm) {
    return next(new ErrorResponse(`Las contraseñas no coinciden.`, 400));
  }

  // Create user
  user = await User.create({
    name,
    email,
    password
  });

  res.status(201).json({
    success: true,
    data: "Usuario creado exitosamente."
  });
});

// @desc      Iniciar sesion
// @route     POST /api/v1/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validar que no esten vacios los campos de correo y contraseña
  if (!email || !password) {
    return next(
      new ErrorResponse(
        "Por favor, ingrese su correo electronico y/o contraseña.",
        400
      )
    );
  }

  // Buscar usuario mediante su direccion de correo y añadimos su contraseña (encriptada)
  const user = await User.findOne({ email }).select("+password");

  // Si el usuario no existe enviar un error
  if (!user) {
    return next(
      new ErrorResponse(
        "Credenciales invalidas. Por favor, verifique su correo y/o contraseña.",
        401
      )
    );
  }

  // Verificar que la contraseña en texto plano coincida con la contraseña encriptada en la BD (llamado a metodo en el modelo)
  const isMatch = await user.matchPassword(password);

  // Si no hay coincidencia enviamos un error (sin indicar que campo es el que esta erroneo, por seguridad)
  if (!isMatch) {
    return next(
      new ErrorResponse(
        "El correo y/o contraseña no son validos, por favor, verifiquelos.",
        401
      )
    );
  }

  // Validar que el usuario este activo
  if (!user.active) {
    return next(
      new ErrorResponse(
        "Tu cuenta no esta activa. Contacta a tu administrador.",
        401
      )
    );
  }

  // Si todo sale bien, enviamos un token como respuesta (haciendo uso de la utilidad 'tokenResponse')
  sendTokenResponse(user, 200, res);
});

// @desc      Cerrar sesion
// @route     POST /api/v1/auth/logout
// @access    Private
exports.logout = asyncHandler(async (req, res, next) => {
  // Limpiar cookie 'token'
  res.clearCookie("token");

  // Enviar respuesta
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc      Cambiar contraseña
// @route     PUT /api/v1/auth/changepassword
// @access    Private
exports.changePassword = asyncHandler(async (req, res, next) => {
  // Obtener el ID del usuario que hace la peticion
  const user = await User.findById(req.user.id).select("+password");

  // Validar la contraseña actual
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(
      new ErrorResponse(
        "Contraseña incorrecta. Por favor, intentelo de nuevo.",
        401
      )
    );
  }

  if (!req.body.newPassword) {
    return next(
      new ErrorResponse("Por favor, ingrese su nueva contraseña.", 400)
    );
  }

  // El campo 'password' del usuario sera igual a la nueva contraseña ingresada en el campo 'newPassword'
  user.password = req.body.newPassword;

  // Guardamos los cambios
  await user.save();

  // Enviamos token en respuesta
  sendTokenResponse(user, 200, res);
});

// @desc      Olvidaste tu contraseña?
// @route     PUT /api/v1/auth/forgotpassword
// @access    Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse("No existe un usuario con ese correo.", 404));
  }

  // Obtener token para restablecer contraseña (se establece en el modelo)
  const resetToken = user.getResetPasswordToken();

  // Guardar cambios al usuario
  await user.save({ validateBeforeSave: false });

  // Crear la URL de restablecimiento
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetpassword/${resetToken}`;

  // Mensaje del correo a enviar al usuario
  const message = `Estas recibiendo este correo porque tu (o alguien mas) solicito restablecer la contraseña. Por favor, ingresa al siguiente enlace: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      // Enviar en el correo: email del usuario, el asunto y el mensaje
      email: user.email,
      subject: "Restablecer tu contraseña",
      message
    });

    // Si no hay problema al enviar el correo, obtenemos respuesta exitosa
    res.status(200).json({ success: true, data: "El correo ha sido enviado." });
  } catch (err) {
    // Mostrar en consola el error
    if (process.env.NODE_ENV === "development") {
      console.log(err);
    }

    // Removemos los campos que se generaron con la solicitud de restablecimiento
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    // Guardamos cambios
    await user.save({ validateBeforeSave: false });

    // Enviamos mensaje de error al cliente
    return next(new ErrorResponse("El correo no se ha enviado.", 500));
  }
});

// @desc      Restablecer contraseña
// @route     PUT /api/v1/auth/resetpassword/:resettoken
// @access    Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Obtener el token hasheado
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  // Buscamos al usuario que coincida con el token de restablecimiento y validamos que aun no haya expirado dicho token
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  // Si no obtenemos nada en la busqueda enviar mensaje de error
  if (!user) {
    return next(new ErrorResponse("El token no es valido.", 400));
  }

  // Establecer la nueva contraseña y removemos los campos que se generaron en la BD
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  // Guardamos cambios
  await user.save();

  // Enviamos respuesta con el token de autenticacion
  sendTokenResponse(user, 200, res);
});
