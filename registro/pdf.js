const PDFDocument = require('pdfkit');
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'app_data',
    password: 'melody2025sql',
    port: 5432,
});

const crearPDF = async function (dataCallback, endCallback) {
    const archivo = new PDFDocument();

    archivo.on('data', dataCallback);
    archivo.on('end', endCallback);

    try {
        const result = await pool.query('SELECT * FROM pelicula ORDER BY id_pelicula');

        // Crear encabezado de la tabla sin la columna de descripción
        archivo.fontSize(12).text('ID', 50, 50);
        archivo.text('Título', 100, 50);
        archivo.text('Duración', 250, 50);
        archivo.text('Estreno', 350, 50);
        archivo.text('Fecha de Registro', 450, 50);

        // Dibujar una línea debajo del encabezado
        archivo.moveTo(50, 70).lineTo(550, 70).stroke();

        // Crear filas de la tabla sin la columna de descripción
        let y = 80;
        result.rows.forEach(row => {
            archivo.text(row.id_pelicula, 50, y);
            archivo.text(row.titulo, 100, y);
            archivo.text(row.duracion, 250, y);
            archivo.text(row.ano_estreno, 350, y);
            archivo.text(row.fecha_registro, 450, y);
            y += 20;
        });

    } catch (error) {
        console.error('Error al obtener películas:', error.stack);
        archivo.text('Error al obtener películas', 50, 50);
    }

    archivo.end();  // Finaliza el documento
}

module.exports = crearPDF;
