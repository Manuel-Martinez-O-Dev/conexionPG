const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const session = require("express-session");

const router = require("./registro/descargar");
const manual = require("./registro/manual");

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: false }
  })
);

// creacion del registro y descarga de manual

app.use("/", router);
app.use("/", manual);

// pagina principal index.html
app.get("/", (req, res) => {
  res.sendFile("./rutas/index.html", {
    root: __dirname,
  });
});

// mostrar pagina del formulario para el login
app.get("/login", (req, res) => {
  res.sendFile("./rutas/login.html", {
    root: __dirname,
  });
});

// consulta a la base de datos para encontrar al usuario y que inicie sesion
app.post("/api/login", async (req, res) => {
  const { nombre_usuario, correo_electronico } = req.body;

  const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "app_data",
    password: "melody2025sql",
    port: 5432,
  });

  try {
    const result = await pool.query(
      "SELECT * FROM cliente WHERE nombre_usuario = $1 AND correo_electronico = $2",
      [nombre_usuario, correo_electronico]
    );

    if (result.rows.length > 0) {
      req.session.user = result.rows[0];
      res.status(200).json({ message: "Inicio de sesión exitoso" });
    } else {
      res.status(401).json({ message: "Credenciales incorrectas" });
    }
  } catch (error) {
    console.error("Error al iniciar sesión:", error.stack);
    res.status(500).send("Error al iniciar sesión");
  }
});

// cierrar sesion
app.get("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500);
    }
    res.status(200);
    console.log("closed session");
    res.redirect("/login");
  });
});

// muestra el formulario para registrar un nuevo usuario
app.get("/cliente", (req, res) => {
  res.sendFile("./rutas/cliente.html", {
    root: __dirname,
  });
});

// inserta los datos del cliente que se registro a la base de datos
app.post("/cliente", async (req, res) => {
  const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "app_data",
    password: "melody2025sql",
    port: 5432,
  });

  const {
    nombre,
    apellido,
    nombre_usuario,
    correo_electronico,
    activo,
    fecha_registro,
  } = req.body;

  const query = `
      SELECT insertNewClient($1, $2, $3, $4, $5, $6)
    `;

  try {
    const result = await pool.query(query, [
      nombre,
      apellido,
      nombre_usuario,
      correo_electronico,
      activo,
      fecha_registro,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al insertar el cliente:", error.stack);
    res.status(500).send("Error al registrar el cliente");
  }
});

// muestra todos los usuarios que se encuentran registrados (solo se muestran para el administrador)
app.get("/clientes", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  res.sendFile("./rutas/clientes.html", {
    root: __dirname,
  });
});

// hace una consulta a la base de datos para obtener todos los usuarios registrados (solo el administrador puede verlos)
app.get("/api/clientes", async (req, res) => {
  try {
    const datos = req.session.user;
    const pool = new Pool({
      user: `${datos.nombre_usuario}`,
      host: "localhost",
      database: "app_data",
      password: `${datos.correo_electronico}`,
      port: 5432,
    });
    const result = await pool.query("SELECT * FROM cliente");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener clientes:", error.stack);
    res.status(500).send("Error al obtener clientes");
  }
});

// muestra la pagina del administrador
app.get("/admin", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  res.sendFile("./rutas/admin.html", {
    root: __dirname,
  });
});

// muestra la pagina para modificar y eliminar un usuario
app.get("/admin/usuarios", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  res.sendFile("./rutas/admin/usuarios.html", {
    root: __dirname,
  });
});

// hace una consulata para modificar un usuario
app.put("/admin/usuarios", async (req, res) => {
  const { id_usuario } = req.body;
  let query;
  let verificar;
  try {
    const datos = req.session.user;
    const pool = new Pool({
      user: `${datos.nombre_usuario}`,
      host: "localhost",
      database: "app_data",
      password: `${datos.correo_electronico}`,
      port: 5432,
    });
    const prueba = await pool.query(
      "select activo from cliente where id_cliente = $1",
      [id_usuario]
    );
    verificar = prueba.rows[0].activo;
  } catch (error) {
    console.log(error);
  }
  if (verificar) {
    query = "UPDATE cliente SET activo = false WHERE id_cliente = $1";
  } else {
    query = "UPDATE cliente SET activo = true WHERE id_cliente = $1";
  }

  try {
    const datos = req.session.user;
    const pool = new Pool({
      user: `${datos.nombre_usuario}`,
      host: "localhost",
      database: "app_data",
      password: `${datos.correo_electronico}`,
      port: 5432,
    });
    const result = await pool.query(query, [id_usuario]);
    if (result.rowCount > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send("Cliente no encontrado");
    }
  } catch (error) {
    res.status(500).send("Error al actualizar el cliente");
  }
});

// hace una consulta para eliminar un usuario de la base de datos
app.delete("/admin/usuarios", async (req, res) => {
  const { id_usuario } = req.body;
  var query = `SELECT deleteClientById($1)`;

  try {
    const datos = req.session.user;
    const pool = new Pool({
      user: `${datos.nombre_usuario}`,
      host: "localhost",
      database: "app_data",
      password: `${datos.correo_electronico}`,
      port: 5432,
    });
    const result = await pool.query(query, [id_usuario]);
    if (result.rowCount > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send("Cliente no encontrado");
    }
  } catch (error) {
    res.status(500).send("Error al eliminar el cliente");
  }
});

// muestra la pagina para agregar editar y eliminar una pelicula
app.get("/admin/peliculas", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  res.sendFile("./rutas/admin/peliculas.html", {
    root: __dirname,
  });
});

// hace una consulta para actualizar los datos de una pelicula que se encuentra en la base de datos
app.post("/admin/peliculas", async (req, res) => {
  const {
    titulo,
    descripcion,
    url,
    portada,
    duracion,
    estreno,
    fecha_registro,
  } = req.body;

  const query = `
    INSERT INTO pelicula (titulo, descripcion, direccion_url, portada_url, duracion, ano_estreno, fecha_registro)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;

  try {
    const datos = req.session.user;
    const pool = new Pool({
      user: `${datos.nombre_usuario}`,
      host: "localhost",
      database: "app_data",
      password: `${datos.correo_electronico}`,
      port: 5432,
    });
    const result = await pool.query(query, [
      titulo,
      descripcion,
      url,
      portada,
      duracion,
      estreno,
      fecha_registro,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al insertar la pelicula:", error.stack);
    res.status(500).send("Error al registrar la pelicula");
  }
});

// hace una consulta para encntrar los datos de una pelicula por el id
app.get("/api/peliculas/editar/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const datos = req.session.user;
    const pool = new Pool({
      user: `${datos.nombre_usuario}`,
      host: "localhost",
      database: "app_data",
      password: `${datos.correo_electronico}`,
      port: 5432,
    });
    const result = await pool.query(
      "SELECT * FROM pelicula WHERE id_pelicula = $1",
      [id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener clientes:", error.stack);
    res.status(500).send("Error al obtener clientes");
  }
});

// hace una consulta para actualizar los datos encontrados por el anterios bloque de codigo
app.put("/admin/peliculas", async (req, res) => {
  const { id_pelicula, titulo, descripcion, url, portada, duracion, estreno } =
    req.body;

  const query = `UPDATE pelicula 
  SET titulo = $2, descripcion = $3, direccion_url = $4, portada_url = $5, duracion = $6, ano_estreno = $7
  WHERE id_pelicula = $1`;

  try {
    const datos = req.session.user;
    const pool = new Pool({
      user: `${datos.nombre_usuario}`,
      host: "localhost",
      database: "app_data",
      password: `${datos.correo_electronico}`,
      port: 5432,
    });
    const result = await pool.query(query, [
      id_pelicula,
      titulo,
      descripcion,
      url,
      portada,
      duracion,
      estreno,
    ]);
    if (result.rowCount > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send("pelicula no encontrado");
    }
  } catch (error) {
    res.status(500).send("Error al actualizar la pelicula");
  }
});

// hace una consulta para eliminar una pelicula de la base de datos
app.delete("/admin/peliculas", async (req, res) => {
  const { id_pelicula } = req.body;
  const query = "DELETE FROM pelicula WHERE id_pelicula = $1";

  try {
    const datos = req.session.user;
    const pool = new Pool({
      user: `${datos.nombre_usuario}`,
      host: "localhost",
      database: "app_data",
      password: `${datos.correo_electronico}`,
      port: 5432,
    });
    const result = await pool.query(query, [id_pelicula]);
    if (result.rowCount > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send("Cliente no encontrado");
    }
  } catch (error) {
    res.status(500).send("Error al actualizar el cliente");
  }
});

// muestra la pagina donde se encuentran todas las peliculas
app.get("/peliculas", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  res.sendFile("./rutas/peliculas.html", {
    root: __dirname,
  });
});

// hace una consulta para obtener todas las peliculas
app.get("/api/peliculas", async (req, res) => {
  try {
    const datos = req.session.user;
    const pool = new Pool({
      user: `${datos.nombre_usuario}`,
      host: "localhost",
      database: "app_data",
      password: `${datos.correo_electronico}`,
      port: 5432,
    });

    const result = await pool.query("SELECT * FROM pelicula ORDER BY titulo");
    // const result = await pool.query("SELECT * FROM peliculaPorActor('Robert', 'Downey Jr.')");
    // const result = await pool.query("SELECT * FROM peliculaPorIdioma('Spanish')");
    // const result = await pool.query("SELECT * FROM peliculaPorClasificacion('Terror')");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener películas:", error.stack);
    res.status(500).send("Error al obtener películas");
  }
});

// hace una consulata para mostrar las ultimas tres peliculas recien agregadas en la pagina de inicio
app.get("/api/peliculas/inicio", async (req, res) => {
  const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "app_data",
    password: "melody2025sql",
    port: 5432,
  });

  try {
    const result = await pool.query(
      "SELECT * FROM pelicula ORDER BY fecha_registro DESC LIMIT 3"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener películas:", error.stack);
    res.status(500).send("Error al obtener películas");
  }
});

// muestra una pagina de error 404
app.use("*", (req, res) => {
  res.sendFile("./rutas/404.html", {
    root: __dirname,
  });
});



// app.post('/api/handle-click', async (req, res) => {
//   const { id_pelicula } = req.body; // Corregido para obtener id_pelicula del cuerpo de la solicitud

//   const query = `
//       INSERT INTO cliente_pelicula (id_cliente, id_pelicula) VALUES ($1, $2)
//   `;

//   try {
//       const datos = req.session.user;
//       const id_cliente = datos.id_cliente;

//       const pool = new Pool({
//           user: datos.nombre_usuario,
//           host: 'localhost',
//           database: 'app_data',
//           password: datos.correo_electronico,
//           port: 5432,
//       });

//       const result = await pool.query(query, [id_cliente, id_pelicula]);
//       console.log(`Se insertó el registro con id_pelicula ${id_pelicula} para el cliente ${id_cliente}`);

//       res.status(201).json(result.rows[0]); // Devuelve el resultado si es necesario
//   } catch (error) {
//       console.error('Error al insertar el registro:', error.stack);
//       res.status(500).send('Error al registrar'); // Envia un mensaje de error al cliente
//   }
// });

// mensaje de que el servidor esta en el puerto 5000
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
