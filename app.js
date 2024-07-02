const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const session = require('express-session');

const router = require('./registro/descargar');
const manual = require('./registro/manual');

const app = express();
const port = 5000;


// creacion del registro

app.use('/', router);
app.use('/', manual);

app.use(bodyParser.json());

// pagina principal index.html
app.get('/', (req, res) => {
  res.sendFile('./rutas/index.html', {
      root: __dirname
  })
});

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'mysecretkey',
  resave: false,
  saveUninitialized: true,
  // cookie: { secure: false } // Cambiar a true en producción
}));

app.get('/login', (req, res) => {
  res.sendFile('./rutas/login.html', {
      root: __dirname
  })
});

app.post('/api/login', async (req, res) => {
  const { nombre_usuario, correo_electronico } = req.body;

  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'app_data',
    password: 'melody2025sql',
    port: 5432,
  });

  try {
    const result = await pool.query(
      'SELECT * FROM cliente WHERE nombre_usuario = $1 AND correo_electronico = $2',
      [nombre_usuario, correo_electronico]
    );

    if (result.rows.length > 0) {
      req.session.user = result.rows[0];
      res.status(200).json({ message: 'Inicio de sesión exitoso' });
    } else {
      res.status(401).json({ message: 'Credenciales incorrectas' });
    }
  } catch (error) {
    console.error('Error al iniciar sesión:', error.stack);
    res.status(500).send('Error al iniciar sesión');
  }
});
app.get('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500);
    }
    res.status(200);
    console.log('closed session');
    res.redirect('/login');
    
  });
});

// cliente para registrar nuevos usuarios

app.get('/cliente', (req, res) => {
    res.sendFile('./rutas/cliente.html', {
      root: __dirname
    })
});

app.post('/cliente', async (req, res) => {

  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'app_data',
    password: 'melody2025sql',
    port: 5432,
  });
  
    const { nombre, apellido, nombre_usuario, correo_electronico, activo, fecha_registro } = req.body;
  
    const query = `
      SELECT insertNewClient($1, $2, $3, $4, $5, $6)
    `;
  
    try {
      const result = await pool.query(query, [nombre, apellido, nombre_usuario, correo_electronico, activo, fecha_registro]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error al insertar el cliente:', error.stack);
      res.status(500).send('Error al registrar el cliente');
    }
});

// clientes.html en este se muestra los usuarios registrados

app.get('/clientes', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

    res.sendFile('./rutas/clientes.html', {
      root: __dirname
    })
});

app.get('/api/clientes', async (req, res) => {
  try {
    const datos = req.session.user;
    const pool = new Pool({
      user: `${datos.nombre_usuario}`,
      host: 'localhost',
      database: 'app_data',
      password: `${datos.correo_electronico}`,
      port: 5432,
    });
    const result = await pool.query('SELECT * FROM cliente');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener clientes:', error.stack);
    res.status(500).send('Error al obtener clientes');
  }
});

// admin.html

app.get('/admin', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.sendFile('./rutas/admin.html', {
    root: __dirname
  })
});

// usuarios.html

app.get('/admin/usuarios', (req, res) => {

  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.sendFile('./rutas/admin/usuarios.html', {
    root: __dirname
  })
});
app.put('/admin/usuarios', async (req, res) => {
  const { id_usuario } = req.body;
  let query;
  let verificar;
  try {
    const datos = req.session.user;
    const pool = new Pool({
      user: `${datos.nombre_usuario}`,
      host: 'localhost',
      database: 'app_data',
      password: `${datos.correo_electronico}`,
      port: 5432,
    });
    const prueba = await pool.query('select activo from cliente where id_cliente = $1', [id_usuario]);
    verificar = prueba.rows[0].activo;
  }
  catch (error) {
    console.log(error)
  }
  if (verificar) {
    query = 'UPDATE cliente SET activo = false WHERE id_cliente = $1';
  }
  else {
    query = 'UPDATE cliente SET activo = true WHERE id_cliente = $1';
  }

  try {
    const datos = req.session.user;
    const pool = new Pool({
      user: `${datos.nombre_usuario}`,
      host: 'localhost',
      database: 'app_data',
      password: `${datos.correo_electronico}`,
      port: 5432,
    });
    const result = await pool.query(query, [id_usuario] );
    if (result.rowCount > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send('Cliente no encontrado');
    }
  } catch (error) {
    res.status(500).send('Error al actualizar el cliente');
  }
});
app.delete('/admin/usuarios', async (req, res) => {
  const { id_usuario } = req.body;
  var query = `SELECT deleteClientById($1)`;

  try {
    const datos = req.session.user;
    const pool = new Pool({
      user: `${datos.nombre_usuario}`,
      host: 'localhost',
      database: 'app_data',
      password: `${datos.correo_electronico}`,
      port: 5432,
    });
    const result = await pool.query(query, [id_usuario] );
    if (result.rowCount > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send('Cliente no encontrado');
    }
  } catch (error) {
    res.status(500).send('Error al eliminar el cliente');
  }
});

// admin/peliculas.html

app.get('/admin/peliculas', (req, res) => {

  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.sendFile('./rutas/admin/peliculas.html', {
    root: __dirname
  })
});
app.post('/admin/peliculas', async (req, res) => {
  const { titulo, descripcion, url, portada, duracion, estreno, fecha_registro } = req.body;

  const query = `
    INSERT INTO pelicula (titulo, descripcion, direccion_url, portada_url, duracion, ano_estreno, fecha_registro)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;

  try {
    const datos = req.session.user;
    const pool = new Pool({
      user: `${datos.nombre_usuario}`,
      host: 'localhost',
      database: 'app_data',
      password: `${datos.correo_electronico}`,
      port: 5432,
    });
    const result = await pool.query(query, [titulo, descripcion, url, portada, duracion, estreno, fecha_registro]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al insertar la pelicula:', error.stack);
    res.status(500).send('Error al registrar la pelicula');
  }
});
app.get('/api/peliculas/editar/:id', async (req, res) => {

  const { id } = req.params;

  try {
    const datos = req.session.user;
    const pool = new Pool({
      user: `${datos.nombre_usuario}`,
      host: 'localhost',
      database: 'app_data',
      password: `${datos.correo_electronico}`,
      port: 5432,
    });
    const result = await pool.query('SELECT * FROM pelicula WHERE id_pelicula = $1', [id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener clientes:', error.stack);
    res.status(500).send('Error al obtener clientes');
  }
});
app.put('/admin/peliculas', async (req, res) => {
  const { id_pelicula, titulo, descripcion, url, portada, duracion, estreno } = req.body;

  const query = `UPDATE pelicula 
  SET titulo = $2, descripcion = $3, direccion_url = $4, portada_url = $5, duracion = $6, ano_estreno = $7
  WHERE id_pelicula = $1`;

  try {
    const datos = req.session.user;
    const pool = new Pool({
      user: `${datos.nombre_usuario}`,
      host: 'localhost',
      database: 'app_data',
      password: `${datos.correo_electronico}`,
      port: 5432,
    });
    const result = await pool.query(query, [id_pelicula, titulo, descripcion, url, portada, duracion, estreno] );
    if (result.rowCount > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send('pelicula no encontrado');
    }
  } catch (error) {
    res.status(500).send('Error al actualizar la pelicula');
  }
});
app.delete('/admin/peliculas', async (req, res) => {
  const { id_pelicula } = req.body;
  const query = 'DELETE FROM pelicula WHERE id_pelicula = $1';

  try {
    const datos = req.session.user;
    const pool = new Pool({
      user: `${datos.nombre_usuario}`,
      host: 'localhost',
      database: 'app_data',
      password: `${datos.correo_electronico}`,
      port: 5432,
    });
    const result = await pool.query(query, [id_pelicula] );
    if (result.rowCount > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send('Cliente no encontrado');
    }
  } catch (error) {
    res.status(500).send('Error al actualizar el cliente');
  }
});


// peliculas.html para mostrar las peliculas

app.get('/peliculas', (req, res) => {

  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.sendFile('./rutas/peliculas.html', {
      root: __dirname
  })
});
app.get('/api/peliculas', async (req, res) => {

  

  try {
    const datos = req.session.user;
    const pool = new Pool({
      user: `${datos.nombre_usuario}`,
      host: 'localhost',
      database: 'app_data',
      password: `${datos.correo_electronico}`,
      port: 5432,
    });
    
    const result = await pool.query('SELECT * FROM pelicula ORDER BY titulo');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener películas:', error.stack);
    res.status(500).send('Error al obtener películas');
  }
});

app.get('/api/peliculas/inicio', async (req, res) => {
  
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'app_data',
    password: 'melody2025sql',
    port: 5432,
  });

  try {
    
    const result = await pool.query('SELECT * FROM pelicula ORDER BY fecha_registro DESC LIMIT 3');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener películas:', error.stack);
    res.status(500).send('Error al obtener películas');
  }
});

// 404

app.use('*', (req, res) => {
  res.sendFile('./rutas/404.html', {
      root: __dirname
  })
});

// mensaje de que el servidor esta en el puerto 5000
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});



