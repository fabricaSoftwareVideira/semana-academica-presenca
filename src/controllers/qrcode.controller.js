// src/controllers/qrcode.controller.js
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const { readJson, writeJson } = require("../utils/file.utils");
const { gerarQrCodeComTexto, gerarPdfTurma } = require("../services/qrcode.service");

const ALUNO_DATA_FILE = path.join(__dirname, "../data/alunos.json");
const QR_CODES_DIR = path.join(__dirname, "../../qrcodes");
const ZIP_PATH = path.join(__dirname, "../../qrcodes.zip");

// Gera QR Code individual
async function gerarQRCodeAluno(matricula) {
    const alunos = readJson(ALUNO_DATA_FILE);
    const aluno = alunos.find(a => a.matricula === matricula);
    if (!aluno) throw new Error(`Aluno ${matricula} não encontrado`);

    const qrCodeDataUrl = await gerarQrCodeComTexto(aluno);

    aluno.qrcodeGerado = true;
    aluno.qrCodeGeradoEm = new Date().toISOString();

    writeJson(ALUNO_DATA_FILE, alunos); // salva atualização
    return { aluno, qrCodeDataUrl };
}

// Gera QR Codes + PDFs + ZIP em lote
async function gerarQRCodeEmLote() {
    if (!fs.existsSync(QR_CODES_DIR)) fs.mkdirSync(QR_CODES_DIR, { recursive: true });

    const alunos = readJson(ALUNO_DATA_FILE);
    const turmas = [...new Set(alunos.map(a => a.turma))];

    // Geração dos QR Codes
    for (const aluno of alunos) {
        const qrData = await gerarQrCodeComTexto(aluno);
        const base64Data = qrData.replace(/^data:image\/png;base64,/, "");
        const turmaDir = path.join(QR_CODES_DIR, aluno.turma);
        if (!fs.existsSync(turmaDir)) fs.mkdirSync(turmaDir, { recursive: true });
        fs.writeFileSync(path.join(turmaDir, `${aluno.matricula}.png`), base64Data, "base64");

        aluno.qrcodeGerado = true;
        aluno.qrCodeGeradoEm = new Date().toISOString();
        console.log(`QR Code gerado para ${aluno.matricula} - ${aluno.nome}`);
    }

    writeJson(ALUNO_DATA_FILE, alunos);

    // PDFs por turma
    for (const turma of turmas) {
        const alunosDaTurma = alunos.filter(a => a.turma === turma);
        await gerarPdfTurma(turma, alunosDaTurma, QR_CODES_DIR);
    }

    // Cria ZIP
    await new Promise((resolve, reject) => {
        const output = fs.createWriteStream(ZIP_PATH);
        const archive = archiver("zip", { zlib: { level: 9 } });

        archive.pipe(output);
        archive.directory(QR_CODES_DIR, false);

        for (const turma of turmas) {
            const pdfFile = path.join(QR_CODES_DIR, `${turma}.pdf`);
            if (fs.existsSync(pdfFile)) archive.file(pdfFile, { name: `${turma}.pdf` });
        }

        archive.finalize();
        output.on("close", resolve);
        archive.on("error", reject);
    });

    return {
        message: `QR Codes gerados para ${alunos.length} alunos em ${turmas.length} turmas.`,
        zipFile: "qrcodes.zip"
    };
}

async function gerarPdfPorTurma() {
    const alunos = readJson(ALUNO_DATA_FILE);
    const turmas = [...new Set(alunos.map(a => a.turma))];

    for (const turma of turmas) {
        const alunosDaTurma = alunos.filter(a => a.turma === turma);
        await gerarPdfTurma(turma, alunosDaTurma, QR_CODES_DIR);
    }

    return { message: `PDFs gerados para ${turmas.length} turmas.` };
}

module.exports = { gerarQRCodeAluno, gerarQRCodeEmLote, gerarPdfPorTurma };
