const express = require('express');
const router = express.Router();
const qrcodeController = require('../controllers/qrcode.controller');
const { ensureAuthenticated, checkRole } = require('../middlewares/auth');

router.post('/gerar', async (req, res) => {
    const { matricula } = req.body;
    if (!matricula) {
        return res.status(400).json({ error: "Matrícula é obrigatória" });
    }
    try {
        const result = await qrcodeController.gerarQRCodeAluno(matricula);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/gerar-lote', ensureAuthenticated, checkRole('admin'), (req, res) => {
    try {
        const result = qrcodeController.gerarQRCodeEmLote();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;