// src/services/qrcode.service.js
const QRCode = require("qrcode");
const { createCanvas } = require("canvas");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { gerarToken } = require("./jwt.service");

// 🎨 Gera QR Code em PNG Base64
async function gerarQrCodeComTexto(aluno) {
    const canvasWidth = 300;
    const canvasHeight = 420;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // fundo branco
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // QR Code
    const qrCanvas = createCanvas(300, 300);
    const token = gerarToken({
        codigo: aluno.codigo,
        turma: aluno.turma,
        nome: aluno.nome
    });
    await QRCode.toCanvas(qrCanvas, token, { width: 300, margin: 2 });
    ctx.drawImage(qrCanvas, 0, 0);

    // Texto
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";

    ctx.font = "bold 18px Arial";
    let y = 320;
    y = drawTextWrapped(ctx, aluno.nome, canvasWidth / 2, y, 280, 20);

    ctx.font = "16px Arial";
    ctx.fillText(`Turma: ${aluno.turma}`, canvasWidth / 2, y);

    return canvas.toDataURL();
}

// Função de apoio para quebrar linhas
function drawTextWrapped(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    for (const word of words) {
        const testLine = line + word + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== "") {
            ctx.fillText(line, x, y);
            line = word + " ";
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
    return y + lineHeight;
}

// Gera PDF por turma
async function gerarPdfTurma(nomeTurma, alunos, outputDir) {
    const doc = new PDFDocument({ autoFirstPage: false });
    const pdfPath = path.join(outputDir, `${nomeTurma}.pdf`);
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    const colunas = 4, linhas = 5;
    const margem = 40;
    const larguraEspaco = (595 - margem * 2) / colunas;
    const alturaEspaco = (842 - margem * 2) / linhas;
    const qrSize = 110;

    for (let i = 0; i < alunos.length; i++) {
        const aluno = alunos[i];
        if (i % (colunas * linhas) === 0) doc.addPage({ size: "A4", margin: 0 });

        const pos = i % (colunas * linhas);
        const col = pos % colunas;
        const row = Math.floor(pos / colunas);
        const x = margem + col * larguraEspaco + (larguraEspaco - qrSize) / 2;
        const y = margem + row * alturaEspaco + 10;

        const qrBase64 = await gerarQrCodeComTexto(aluno);
        const imgBuffer = Buffer.from(qrBase64.replace(/^data:image\/png;base64,/, ""), "base64");
        doc.image(imgBuffer, x, y, { width: qrSize });
    }

    doc.end();
    return pdfPath;
}

module.exports = { gerarQrCodeComTexto, gerarPdfTurma };
