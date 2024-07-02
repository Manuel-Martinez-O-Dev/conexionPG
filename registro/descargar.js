const { Router } = require('express');
const crearPDF = require('./pdf');

const router = Router();

router.get('/pdf', (req, res) => {
    res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=registro.pdf",
    });

    crearPDF(
        (data) => {
            res.write(data);
        },
        () => {
            res.end();
        }
    );
});

module.exports = router;
