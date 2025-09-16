const path = require("path");
const fs = require("fs");
const express = require('express');
const router = express.Router();
const qrcodeController = require('../controllers/qrcode.controller');
const { ensureAuthenticated, checkRole } = require('../middlewares/auth');

router.get('/', (req, res) => {
    const user = req.user;
    const isAuthenticated = req.isAuthenticated();
    res.render('gerar-qrcode', { user, isAuthenticated });
});

router.post('/gerar', async (req, res) => {
    const { matricula } = req.body;
    if (!matricula) {
        return res.status(400).json({ error: "Matrícula é obrigatória" });
    }
    try {
        const result = await qrcodeController.gerarQRCodeAluno(matricula);
        // res.json(result);
        res.render('gerar-qrcode', { qrCodeDataURL: result.qrCodeDataUrl, aluno: result.aluno, user: req.user, isAuthenticated: req.isAuthenticated() });
    } catch (error) {
        // res.status(500).json({ error: error.message });
        res.render('gerar-qrcode', { error: error.message });
    }
});

router.post('/gerar-lote', ensureAuthenticated, checkRole('admin'), async (req, res) => {
    try {
        const user = req.user;
        const isAuthenticated = req.isAuthenticated();
        const result = await qrcodeController.gerarQRCodeEmLote();

        res.render('gerar-qrcode', { message: result.message, user, isAuthenticated, zipFile: result.zipFile });
    } catch (error) {
        res.render('gerar-qrcode', { error: error.message });
    }
});

router.post('/gerar-pdf', ensureAuthenticated, checkRole('admin'), async (req, res) => {
    try {
        const user = req.user;
        const isAuthenticated = req.isAuthenticated();
        const result = await qrcodeController.gerarPdfPorTurma();

        res.render('gerar-qrcode', { message: result.message, user, isAuthenticated, pdfFile: result.pdfFile });
    } catch (error) {
        res.render('gerar-qrcode', { error: error.message });
    }
});

router.get('/download/:file', ensureAuthenticated, checkRole('admin'), (req, res) => {
    const filePath = path.join(__dirname, "../../", req.params.file);
    res.download(filePath);
});

module.exports = router;