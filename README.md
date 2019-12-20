# API RESTful para Manejo de Inventario

> Permite gestionar usuarios, matrices, sucursales y productos.

## Documentacion

Para visualizar de manera grafica las rutas existentes, parametros y datos que requieren, usted puede acceder al archivo en `/public/index.html`, o bien, configurar la API y correr el servidor para que pueda acceder a la direccion `localhost:5000` y ver la informacion.

---

## Tecnologias

- [Express.js](https://expressjs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Node.js](https://nodejs.org/)
- JavaScript

---

## Requisitos

- [Node.js](https://nodejs.org/) >= 12.9.0
- NPM (Incluido con Node.js) >= 6.10.2
- Cliente para realizar peticiones (como [Postman](https://www.getpostman.com/))

---

## Instalacion y Configuracion

### <b>Variables de Entorno</b>

Por motivos de seguridad y que estas pueden cambiar, el archivo que contiene las variables de entorno no se sube al repositorio. Para hacer uso de esta API debe seguir los pasos que se muestran a continuacion.

<details><summary><b>Ver instrucciones</b></summary>

1.  Crear archivo `config.env` en carpeta config y agregar lo siguiente:

```diff
  NODE_ENV=development
  PORT=5000
```

- Para modo produccion cambiar `development` por `production`.
- El puerto queda a su consideracion.

2.  Registrarse y crear una base de datos MongoDB Atlas (https://www.mongodb.com/cloud/atlas/register) y obtener el string de conexion.

- Tambien puede ser una base de datos en local o en otro servicio que utilice (debe ser MongoDB y que ofrezca un string de conexion).

3.  Copiar el string de conexion y agregarlo al archivo `config.env`:

```diff
    NODE_ENV=development
    PORT=5000

+   MONGO_URI=STRING_DE_CONEXION
```

4.  La API utiliza JWT para autenticacion y proteccion de rutas, debe establecer una llave secreta, un tiempo de expiracion para el token y para la cookie:

```diff
    NODE_ENV=development
    PORT=5000

    MONGO_URI=STRING_DE_CONEXION

+   JWT_SECRET=CLAVE_SECRETA
+   JWT_EXPIRE=30d
+   JWT_COOKIE_EXPIRE=30
```

5.  Si desea hacer uso del reestablecimiento de contraseñas requiere de un servidor SMTP para enviar correos (para efectos de prueba puede usar https://mailtrap.io/) y agregar los datos al `config.env`:

```diff
    NODE_ENV=development
    PORT=5000

    MONGO_URI=STRING_DE_CONEXION

    JWT_SECRET=CLAVE_SECRETA
    JWT_EXPIRE=30d
    JWT_COOKIE_EXPIRE=30

+   SMTP_HOST=smtp.mailtrap.io
+   SMTP_PORT=2525
+   SMTP_EMAIL=
+   SMTP_PASSWORD=
+   FROM_EMAIL=
+   FROM_NAME=
```

6.  Para establecer la carpeta donde se subiran archivos (como las imagenes de productos) asi como su tamaño, debe agregar lo siguiente a su archivo `config.env`:

```diff
    NODE_ENV=development
    PORT=5000

    MONGO_URI=STRING_DE_CONEXION

    JWT_SECRET=CLAVE_SECRETA
    JWT_EXPIRE=30d
    JWT_COOKIE_EXPIRE=30

    SMTP_HOST=smtp.mailtrap.io
    SMTP_PORT=2525
    SMTP_EMAIL=
    SMTP_PASSWORD=
    FROM_EMAIL=
    FROM_NAME=

+   FILE_UPLOAD_PATH=./public/uploads
+   MAX_FILE_UPLOAD=1000000
```

</details>

### <b>Limitar peticiones</b>

Es posible cambiar el numero de peticiones que una misma IP puede realizar en un periodo de tiempo establecido (se reinicia el contador al termino de este periodo) para evitar ataques donde se reciban muchas peticiones. Puede cambiarlo en el archivo `server.js` en las lineas `63` y `64`.

```
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // Tiempo de 10 min por default
  max: 150 // Numero de peticiones por IP
});
```

### <b>Dependencias</b>

Para instalar las dependencias que se encuentran en el archivo `package.json` debera ejecutar el siguiente comando en la terminal:

    $ npm install

Para entornos de desarrollo y pruebas tambien ejecutar el siguiente comando:

    $ npm install -D nodemon

---

## Ejecutar aplicacion

Para iniciar la aplicacion en modo desarrollo, ejecute el comando:

    $ npm run dev

Para entorno de produccion:

    $ npm start

---

## Importar datos de prueba

Se incluyen datos para alimentar la base de datos y probar la funcionalidad de la API.

Para insertar datos de prueba:

    $ npm seeder -i

Para eliminar datos de prueba:

    $ npm seeder -d

---

## Dependencias Utilizadas

- [bcryptjs](https://www.npmjs.com/package/bcryptjs): Hashing de contraseñas.
- [colors](https://www.npmjs.com/package/colors): Añadir colores a la terminal (util para los errores, respuestas exitosas, etc.).
- [cookie-parser](https://www.npmjs.com/package/cookie-parser): Analiza el header `Cookie` y coloca la informacion de la cookie en un objeto `req` en el middleware.
- [cors](https://www.npmjs.com/package/cors): Activa el uso del protocolo Cross-Origin Resource Sharing (CORS) añadiendo los headers correspondientes permitiendo asi a otros dominios (o clientes) hacer peticiones a la API.
- [dotenv](https://www.npmjs.com/package/dotenv): Carga variables de entorno desde un archivo `.env` hacia `process.env`, separando asi informacion sensible de estar escrita directamente en el codigo (configuracion de base de datos, servidores SMTP, credenciales varias, etc.).
- [express](https://www.npmjs.com/package/express): Framework ligero para aplicaciones web que permite gestionar rutas, peticiones, etc.
- [express-fileupload](https://www.npmjs.com/package/express-fileupload): Da acceso desde `req.files` a un archivo cuando lo cargas y poder llamarlo asi desde peticiones al servidor con express.
- [express-mongo-sanitize](https://www.npmjs.com/package/express-mongo-sanitize): Remueve caracteres ilegales de los datos que ingresan los usuarios y prevenir la inyeccion de operadores de MongoDB.
- [express-rate-limit](https://www.npmjs.com/package/express-rate-limit): Limitar peticiones desde una misma IP en un periodo determinado de tiempo, puede usarse globalmente o solo en ciertas rutas como la de registrar un nuevo usuario o la de recuperar contraseña.
- [helmet](https://www.npmjs.com/package/helmet): Coleccion de pequeñas funciones middleware que establecen encabezados relacionados con seguridad.
- [xss-clean](https://www.npmjs.com/package/xss-clean): Protege contra ataques Cross Site Scripting no permitiendo que los datos ingresados por el usuario se guarden en la base de datos.
- [hpp](https://www.npmjs.com/package/hpp): Protege contra ataques de polucion de parametros HTTP.
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken): Permite implementar [JSON Web Tokens](https://jwt.io/) para mandar la peticion + token para que despues el servidor se encargue de validar que este token corresponda al usuario y este si pueda realizar la accion o peticion.
- [mongoose](https://www.npmjs.com/package/mongoose): Herramienta de modelado de objetos (ODM) que se encarga de gestionar las relaciones entre datos, validacion de esquemas, entre otras cosas.
- [morgan](https://www.npmjs.com/package/morgan): Permite 'loggear' peticiones, errores, mensajes, etc., directamente en la consola y asi saber que esta pasando en nuestra aplicacion.
- [nodemailer](https://www.npmjs.com/package/nodemailer): Sirve para enviar correos desde Node.js y asi poder utilizar el protocolo SMTP.
