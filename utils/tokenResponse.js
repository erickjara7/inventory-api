// Obtener token del modelo, crear cookie y enviar la respuesta
const sendTokenResponse = (user, statusCode, res) => {
  // Crear token
  const token = user.getSignedJwtToken();

  const options = {
    // Tiempo de expiracion
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, token });
};

module.exports = sendTokenResponse;
