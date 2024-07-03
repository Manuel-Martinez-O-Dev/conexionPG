const PDFDocument = require("pdfkit");
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "app_data",
  password: "melody2025sql",
  port: 5432,
});

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = {
    month: "short",
    day: "2-digit",
    year: "numeric",
    // hour: "2-digit",
    // minute: "2-digit",
    // second: "2-digit",
    hour12: false,
  };
  return date.toLocaleDateString("en-US", options).replace(",", "");
};

const crearPDF = async function (dataCallback, endCallback) {
  const archivo = new PDFDocument();

  archivo.on("data", dataCallback);
  archivo.on("end", endCallback);

  try {
    // Películas section
    archivo.fontSize(16).text("Películas", 50, 30);
    archivo.fontSize(12).text("ID", 50, 60);
    archivo.text("Título", 100, 60);
    archivo.text("Duración", 250, 60);
    archivo.text("Estreno", 350, 60);
    archivo.text("Fecha de Registro", 450, 60);
    archivo.moveTo(50, 80).lineTo(550, 80).stroke();

    const peliculas = await pool.query("SELECT * FROM pelicula ORDER BY id_pelicula");
    let y = 90;
    peliculas.rows.forEach((row) => {
      archivo.text(row.id_pelicula, 50, y);
      archivo.text(row.titulo, 100, y);
      archivo.text(row.duracion, 250, y);
      archivo.text(row.ano_estreno, 350, y);
      archivo.text(formatDate(row.fecha_registro), 450, y);
      y += 20;
    });

    // Usuarios section
    y += 30;
    archivo.fontSize(16).text("Usuarios", 50, y);
    y += 30;
    archivo.fontSize(12).text("ID Cliente", 50, y);
    archivo.text("Nombre", 150, y);
    archivo.text("Nombre Usuario", 250, y);
    archivo.text("Activo", 400, y);
    archivo.text("Fecha de Registro", 450, y);
    archivo.moveTo(50, y + 20).lineTo(550, y + 20).stroke();

    const clientes = await pool.query("SELECT id_cliente, nombre, nombre_usuario, activo, fecha_registro FROM cliente ORDER BY id_cliente");
    y += 30;
    clientes.rows.forEach((row) => {
      archivo.text(row.id_cliente, 50, y);
      archivo.text(row.nombre, 150, y);
      archivo.text(row.nombre_usuario, 250, y);
      archivo.text(row.activo, 400, y);
      archivo.text(formatDate(row.fecha_registro), 450, y);
      y += 20;
    });

    // Seguimiento section
    y += 30;
    archivo.fontSize(16).text("Seguimiento", 50, y);
    y += 30;
    archivo.fontSize(12).text("ID Película", 50, y);
    archivo.text("Título", 150, y);
    archivo.text("Fecha de Cambio", 300, y);
    archivo.moveTo(50, y + 20).lineTo(550, y + 20).stroke();

    const seguimiento = await pool.query("SELECT * FROM seguimiento ORDER BY s_id_pelicula");
    y += 30;
    seguimiento.rows.forEach((row) => {
      archivo.text(row.s_id_pelicula, 50, y);
      archivo.text(row.s_titulo, 150, y);
      archivo.text(formatDate(row.s_fecha_cambio), 300, y);
      y += 20;
    });

  } catch (error) {
    console.error("Error al obtener datos:", error.stack);
    archivo.text("Error al obtener datos", 50, 50);
  }

  archivo.end(); // Finaliza el documento
};

module.exports = crearPDF;
