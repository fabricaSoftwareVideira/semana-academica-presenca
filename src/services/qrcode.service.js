const QRCode = require("qrcode");
const { createCanvas } = require("canvas");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");

const JWT_SECRET = process.env.JWT_SECRET || "chave-secreta";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "1y"; // expira em 1 ano

// 🔑 Gera token assinado para o aluno
function gerarTokenAluno(aluno) {
    return jwt.sign(
        {
            matricula: aluno.matricula,
            turma: aluno.turma,
            nome: aluno.nome
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    );
}


async function gerarPdfTurma(nomeTurma, alunos, qrCodesDir) {
    const doc = new PDFDocument({ autoFirstPage: false });
    const pdfPath = path.join(qrCodesDir, `${nomeTurma}.pdf`);
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Configuração da grade (4 colunas × 4 linhas = 16 por página)
    const colunas = 4;
    const linhas = 5;
    const margem = 30;
    const larguraEspaco = (595 - margem * 2) / colunas; // largura de cada célula
    const alturaEspaco = (842 - margem * 2) / linhas;   // altura de cada célula
    const qrSize = 110; // tamanho do QRCode dentro da célula

    let count = 0;

    for (const aluno of alunos) {
        if (count % (colunas * linhas) === 0) {
            doc.addPage({ size: "A4", margin: 0 });
        }

        const pos = count % (colunas * linhas);
        const col = pos % colunas;
        const row = Math.floor(pos / colunas);

        const x = margem + col * larguraEspaco + (larguraEspaco - qrSize) / 2;
        const y = margem + row * alturaEspaco + 10;

        const payload = gerarTokenAluno(aluno);

        const base64 = await gerarQrCodeComTexto(payload, aluno);
        const img = base64.replace(/^data:image\/png;base64,/, "");

        // desenha o QRCode
        doc.image(Buffer.from(img, "base64"), x, y, { width: qrSize });
        count++;
    }

    doc.end();
    console.log(`PDF gerado: ${pdfPath}`);
}

function drawTextWrapped(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    for (let word of words) {
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

async function gerarQrCodeComTexto(payload, aluno) {
    const canvasWidth = 300;
    const canvasHeight = 420;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const qrCanvas = createCanvas(300, 300);
    await QRCode.toCanvas(qrCanvas, payload, { width: 300, margin: 2 });
    ctx.drawImage(qrCanvas, 0, 0);

    ctx.fillStyle = "#000";
    ctx.textAlign = "center";

    ctx.font = "bold 18px Arial";
    let y = 320;
    y = drawTextWrapped(ctx, aluno.nome, canvasWidth / 2, y, 280, 20);

    ctx.font = "16px Arial";
    ctx.fillText(`Turma: ${aluno.turma}`, canvasWidth / 2, y);

    return canvas.toDataURL();
}

module.exports = { gerarQrCodeComTexto, gerarPdfTurma };
