// Middlewares y Utilidades
const asyncHandler = require("../middlewares/asyncHandler");
const ErrorResponse = require("../utils/errorResponse");
const isEmpty = require("../utils/isEmpty");
const path = require("path");

// Carga de los modelos a utilizar
const Product = require("../models/Product");
const Branch = require("../models/Branch");
const Parent = require("../models/Parent");

// @desc    Obtener un producto
// @route   GET /api/v1/products/:id
// @access  Private ["Admin", "Manager", "Publisher"]
exports.readSingleProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (isEmpty(product)) {
    return next(new ErrorResponse("No existe ese producto.", 404));
  }

  res.status(200).json({ success: true, data: product });
});

// @desc    Obtener productos
// @route   GET /api/v1/products
// @access  Private ["Admin", "Manager", "Publisher"]
exports.readProducts = asyncHandler(async (req, res, next) => {
  if (req.user.role === "admin") {
    // Buscar matriz donde el usuario sea administrador
    let parent = await Parent.findOne().where({ admin: req.user.id });

    // Buscar productos donde el ID se encuentre en el array de productos de la matriz o productos en donde su campo branch se encuentre en el array de sucursales en la matriz
    let products = await Product.find({
      $or: [{ _id: parent.products }, { branch: parent.branches }]
    });

    // Validar que existan productos
    if (isEmpty(products)) {
      return next(
        new ErrorResponse(
          "No se encontraron productos registrados en tu matriz o sucursales.",
          404
        )
      );
    }

    // Enviar respuesta
    res
      .status(200)
      .json({ success: true, count: products.length, data: products });
  }

  if (req.user.role === "manager") {
    // Buscar sucursal donde su ID corresponda con el campo 'branch' del usuario
    let branch = await Branch.findOne().where({ manager: req.user.id });

    // Buscar productos donde el ID se encuentre en el array de productos de la sucursal
    products = await Product.find()
      .where("_id")
      .in(branch.products)
      .exec();

    // Validar que existan productos
    if (isEmpty(products)) {
      return next(
        new ErrorResponse(
          "No se encontraron productos registrados en tu sucursal.",
          404
        )
      );
    }

    // Enviar respuesta
    res
      .status(200)
      .json({ success: true, count: products.length, data: products });
  }

  if (req.user.role === "publisher") {
    if (req.user.parent) {
      // Buscar matriz donde el usuario este asignado
      parent = await Parent.findOne().where({ _id: req.user.parent });

      products = await Product.find()
        .where("_id")
        .in(parent.products)
        .exec();

      // Validar que existan productos
      if (isEmpty(products)) {
        return next(
          new ErrorResponse(
            "No se encontraron productos registrados en tu matriz.",
            404
          )
        );
      }

      // Enviar respuesta
      res
        .status(200)
        .json({ success: true, count: products.length, data: products });
    } else if (req.user.branch) {
      // Buscar sucursal donde el usuario este asignado
      branch = await Branch.findOne().where({ _id: req.user.branch });

      products = await Product.find()
        .where("_id")
        .in(branch.products)
        .exec();

      // Validar que existan productos
      if (isEmpty(products)) {
        return next(
          new ErrorResponse(
            "No se encontraron productos registrados en tu sucursal.",
            404
          )
        );
      }

      // Enviar respuesta
      res
        .status(200)
        .json({ success: true, count: products.length, data: products });
    } else {
      return next(
        new ErrorResponse(
          "No puedes visualizar productos porque no haz sido asignado a una matriz o sucursal.",
          401
        )
      );
    }
  }
});

// @desc    Insertar un producto
// @route   POST /api/v1/products
// @access  Private ["Admin", "Manager", "Publisher"]
exports.createProduct = asyncHandler(async (req, res, next) => {
  // Campos a ingresar
  const newProduct = new Product({
    name: req.body.name,
    partNumber: req.body.partNumber,
    brand: req.body.brand,
    description: req.body.description,
    weight: req.body.weight,
    weightUnit: req.body.weightUnit,
    initialStock: req.body.initialStock,
    initialCost: req.body.initialCost,
    buyPrice: req.body.buyPrice,
    retailPrice: req.body.retailPrice,
    wholesalePrice: req.body.wholesalePrice,
    tags: req.body.tags,
    parent: req.user.parent,
    branch: req.user.branch
  });

  if (!isEmpty(newProduct.tags)) {
    // Removemos los posibles espacios dentro del campo 'tags' y despues separamos por comas e insertamos en el arreglo
    newProduct.tags = req.body.tags.replace(/ +/g, "").split(",");
  }

  // Si el usuario haciendo la peticion esta asignado a una matriz entonces el producto corresponde a una matriz
  if (!isEmpty(newProduct.parent)) {
    // Buscar matriz
    const parent = await Parent.findById(req.user.parent);

    // Añadir producto a array de productos en la matriz
    parent.products.unshift(newProduct.id);

    // Guardar cambios en matriz
    parent.save();
  }

  // Si el usuario haciendo la peticion esta asignado a una sucursal entonces el producto corresponde a una sucursal
  if (!isEmpty(newProduct.branch)) {
    // Buscar sucursal
    const branch = await Branch.findById(req.user.branch);

    // Añadir producto a array de productos en la sucursal
    branch.products.unshift(newProduct.id);

    // Guardar cambios en sucursal
    branch.save();
  }

  // Crear producto
  const product = await Product.create(newProduct);

  // Enviar respuesta
  res.status(201).json({
    success: true,
    data: product
  });
});

// @desc    Modificar un producto
// @route   PUT /api/v1/products/:id
// @access  Private ["Admin", "Manager", "Publisher"]
exports.updateProduct = asyncHandler(async (req, res, next) => {
  // Buscar producto mediante ID
  let product = await Product.findById(req.params.id);

  // Validar que exista el producto
  if (isEmpty(product)) {
    return next(new ErrorResponse(`No se encontró ese producto.`, 404));
  }

  // Validar que el usuario tenga derechos sobre el producto
  if (
    !isEmpty(product.parent) &&
    !isEmpty(req.user.parent) &&
    product.parent.toString() !== req.user.parent.toString()
  ) {
    return next(
      new ErrorResponse("Este producto no pertenece a tu matriz.", 401)
    );
  }

  // Validar que el usuario tenga derechos sobre el producto
  if (
    !isEmpty(product.branch) &&
    !isEmpty(req.user.branch) &&
    product.branch.toString() !== req.user.branch.toString()
  ) {
    return next(
      new ErrorResponse("Este producto no pertenece a tu sucursal.", 401)
    );
  }

  if (!isEmpty(req.body.tags)) {
    // Si el campo 'tags' no esta vacio hacemos la siguiente validacion
    // Removemos los posibles espacios dentro del campo 'tags' y despues separamos por comas e insertamos en el arreglo
    req.body.tags = req.body.tags.replace(/ +/g, "").split(",");
  }

  // Actualizar el producto
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: false
  });

  // Enviar respuesta
  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Agregar imagenes a producto
// @route   PUT /api/v1/products/:id/photo
// @access  Private ["Admin", "Manager", "Publisher"]
exports.productPhotoUpload = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  // Validar que el producto exista
  if (isEmpty(product)) {
    return next(new ErrorResponse(`No se encontró ese producto.`, 404));
  }

  // Validar que se haya subido un archivo
  if (isEmpty(req.files)) {
    return next(new ErrorResponse(`Por favor, suba un archivo.`, 400));
  }

  const file = req.files.file;

  // Validar que el archivo sea una imagen
  if (!file.mimetype.startsWith("image")) {
    return next(new ErrorResponse(`Por favor, suba una imagen.`, 400));
  }

  // Validar tamaño del archivo
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Por favor, suba una imagen con un peso menor a: ${process.env.MAX_FILE_UPLOAD}.`,
        400
      )
    );
  }

  // Generador numeros aleatorios
  const randomGen = Math.floor(Math.random() * 10000 + 1);

  // Crear nombre personalizado para la imagen (IMG_'id del producto'_'numero aleatorio'.extensionImagen)
  file.name = `IMG_${product._id}_${randomGen}${path.parse(file.name).ext}`;

  // Mover el archivo a la carpeta especificada
  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(
        new ErrorResponse(`Ocurrio un problema al subir la imagen.`, 500)
      );
    }

    // Si el producto no tiene imagenes aun, borrar la imagen por default
    if (product.images[0] === "no-image.jpg") {
      product.images = [];
    }

    // Agregar la imagen al array de imagenes de producto
    product.images.unshift(file.name);
    product.save();

    res.status(200).json({
      success: true,
      data: file.name
    });
  });
});

// @desc    Eliminar un producto mediante su ID
// @route   DELETE /api/v1/products/:id
// @access  Private ["Admin", "Manager", "Publisher"]
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  // Buscar el producto mediante el ID proporcionado
  const product = await Product.findById(req.params.id);

  // Si no existe el producto enviar mensaje de error
  if (isEmpty(product)) {
    return next(new ErrorResponse("El producto proporcionado no existe.", 404));
  }

  // Validar que el usuario tenga derechos sobre el producto
  if (
    !isEmpty(product.parent) &&
    !isEmpty(req.user.parent) &&
    product.parent.toString() !== req.user.parent.toString()
  ) {
    return next(
      new ErrorResponse("Este producto no pertenece a tu matriz.", 401)
    );
  }

  // Validar que el usuario tenga derechos sobre el producto
  if (
    !isEmpty(product.branch) &&
    !isEmpty(req.user.branch) &&
    product.branch.toString() !== req.user.branch.toString()
  ) {
    return next(
      new ErrorResponse("Este producto no pertenece a tu sucursal.", 401)
    );
  }

  // Si el producto si existe, eliminar
  product.remove();

  // Enviar respuesta exitosa
  res.status(200).json({ success: true, data: {} });
});
