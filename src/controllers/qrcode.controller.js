const path = require("path");
const fs = require("fs");
const { readJson } = require("../utils/file.utils");
const { gerarQrCodeComTexto } = require("../services/qrcode.service");
const ALUNO_DATA_FILE = path.join(__dirname, "../data/alunos.json");
const qrCodesDir = path.join(__dirname, "../../qrcodes");

async function gerarQRCodeAluno(matricula) {
    try {
        const alunos = readJson(ALUNO_DATA_FILE);
        const aluno = alunos.find((a) => a.matricula === matricula);
        if (!aluno) {
            throw new Error("Aluno não encontrado");
        }
        const qrCodeDataUrl = await gerarQrCodeComTexto(matricula, aluno);
        aluno.qrcodeGerado = true;
        aluno.qrCodeGeradoEm = new Date().toISOString();
        return { aluno, qrCodeDataUrl };
    } catch (error) {
        throw new Error(`Erro ao gerar QR Code: ${error.message}`);
    }
}

// Gerar QR Codes em lote para todos os alunos e armazenar as imagens em arquivos na pasta ./qrcodes
async function gerarQRCodeEmLote() {
    try {
        if (!fs.existsSync(qrCodesDir)) {
            fs.mkdirSync(qrCodesDir);
        }

        const alunos = readJson(ALUNO_DATA_FILE);
        let gerados = 0;
        const total = alunos.length;

        for (const aluno of alunos) {
            const payload = JSON.stringify(aluno.matricula);
            const qrCodeDataUrl = await gerarQrCodeComTexto(payload, aluno);
            const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
            const outputFile = path.join(qrCodesDir, `${aluno.matricula}.png`);
            fs.writeFileSync(outputFile, base64Data, "base64");
            aluno.qrcodeGerado = true;
            aluno.qrCodeGeradoEm = new Date().toISOString();
            gerados++;
            console.log(`QR Code gerado para ${aluno.matricula} (${gerados}/${total})`);
        }

        return { message: `QR Codes gerados para ${gerados} alunos. Arquivos salvos em um diretório chamado 'qrcodes' na raiz do projeto.` };
    } catch (error) {
        throw new Error(`Erro ao gerar QR Codes em lote: ${error.message}`);
    }
}


module.exports = { gerarQRCodeAluno, gerarQRCodeEmLote };