const QRCode = require("qrcode");
const { createCanvas } = require("canvas");

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

module.exports = { gerarQrCodeComTexto };
