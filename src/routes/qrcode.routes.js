const path = require("path");
const fs = require("fs");
const express = require("express");
const router = express.Router();

const { gerarQRCodeAluno, gerarQRCodeEmLote, gerarPdfPorTurma } = require("../controllers/qrcode.controller");
const { ensureAuthenticated, checkRole } = require("../middlewares/auth");

// Página principal de geração de QR Codes
router.get("/", (req, res) => {
    const user = req.user;
    const isAuthenticated = req.isAuthenticated();
    res.render("gerar-qrcode", { user, isAuthenticated });
});

// Gera QR Code individual
router.post("/gerar", async (req, res) => {
    const { matricula } = req.body;
    const user = req.user;
    const isAuthenticated = req.isAuthenticated();

    if (!matricula) {
        return res.render("gerar-qrcode", { user, isAuthenticated, error: "Matrícula é obrigatória" });
    }

    try {
        const result = await gerarQRCodeAluno(matricula);
        res.render("gerar-qrcode", {
            user,
            isAuthenticated,
            qrCodeDataURL: result.qrCodeDataUrl,
            aluno: result.aluno,
            message: `QR Code gerado para ${result.aluno.nome}`,
            error: null,
            zipFile: null
        });
    } catch (err) {
        res.render("gerar-qrcode", { user, isAuthenticated, error: err.message });
    }
});

// Gera QR Codes + PDFs + ZIP em lote (Admin)
router.post("/gerar-lote", ensureAuthenticated, checkRole("admin"), async (req, res) => {
    const user = req.user;
    const isAuthenticated = req.isAuthenticated();

    try {
        const result = await gerarQRCodeEmLote();
        res.render("gerar-qrcode", { user, isAuthenticated, message: result.message, zipFile: result.zipFile });
    } catch (err) {
        res.render("gerar-qrcode", { user, isAuthenticated, error: err.message });
    }
});

// Gera PDFs por turma (Admin)
router.post("/gerar-pdf", ensureAuthenticated, checkRole("admin"), async (req, res) => {
    const user = req.user;
    const isAuthenticated = req.isAuthenticated();

    try {
        const result = await gerarPdfPorTurma();
        res.render("gerar-qrcode", { user, isAuthenticated, message: result.message });
    } catch (err) {
        res.render("gerar-qrcode", { user, isAuthenticated, error: err.message });
    }
});

// Download do arquivo ZIP ou PDF
router.get("/download/:file", ensureAuthenticated, checkRole("admin"), (req, res) => {
    const fileName = req.params.file;
    const filePath = path.join(__dirname, "../../", fileName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send("Arquivo não encontrado");
    }

    res.download(filePath, fileName, (err) => {
        if (err) console.error(`Erro ao baixar ${fileName}:`, err);
    });
});

module.exports = router;
