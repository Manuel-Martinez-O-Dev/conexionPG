const { Router } = require("express");
const path = require("path");

const router = Router();

router.get("/manual", (req, res) => {
  const filePath = path.join(__dirname, "../archivos/manual-de-uso.pdf"); // Reemplaza 'ruta/al/archivo.pdf' con la ruta real a tu archivo PDF

  res.download(filePath, "manual-de-uso.pdf", (err) => {
    if (err) {
      console.error("Error al descargar el archivo:", err);
      res.status(500).send("Error al descargar el archivo");
    }
  });
});

module.exports = router;
