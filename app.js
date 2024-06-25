const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'app_data',
    password: 'melody2025sql',
    port: 5432,
});

app.use(bodyParser.json());


app.get('/', (req, res) => {
    res.send('<p> a la url agregale /register despues del 5000, quedaria como 5000/register </p>')
});

// ruta register

app.get('/register', (req, res) => {
    res.sendFile('./rutas/register.html', {
      root: __dirname
    })
});

app.post('/register', async (req, res) => {
    const { nombre, apellido, nombre_usuario, correo_electronico } = req.body;
    const fecha_registro = new Date();
  
    try {
        const result = await pool.query(
            'INSERT INTO cliente (nombre, apellido, nombre_usuario, correo_electronico, activo, fecha_registro) VALUES ($1, $2, $3, $4, true, $5) RETURNING *',
            [nombre, apellido, nombre_usuario, correo_electronico, fecha_registro]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});