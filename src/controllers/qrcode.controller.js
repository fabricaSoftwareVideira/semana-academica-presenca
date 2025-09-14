const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const jwt = require("jsonwebtoken");
const { readJson } = require("../utils/file.utils");
const { gerarQrCodeComTexto } = require("../services/qrcode.service");

const ALUNO_DATA_FILE = path.join(__dirname, "../data/alunos.json");
const qrCodesDir = path.join(__dirname, "../../qrcodes");
const zipPath = path.join(__dirname, "../../qrcodes.zip");

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

async function gerarQRCodeAluno(matricula) {
    try {
        const alunos = readJson(ALUNO_DATA_FILE);
        const aluno = alunos.find((a) => a.matricula === matricula);
        if (!aluno) {
            throw new Error(`Aluno com matrícula ${matricula} não encontrado.`);
        }

        // 🔑 Token seguro no QR
        const token = gerarTokenAluno(aluno);

        const qrCodeDataUrl = await gerarQrCodeComTexto(token, aluno);
        aluno.qrcodeGerado = true;
        aluno.qrCodeGeradoEm = new Date().toISOString();

        return { aluno, qrCodeDataUrl };
    } catch (error) {
        throw new Error(error.message);
    }
}

async function gerarQRCodeEmLote() {
    try {
        if (!fs.existsSync(qrCodesDir)) {
            fs.mkdirSync(qrCodesDir);
        }

        const alunos = readJson(ALUNO_DATA_FILE);
        let gerados = 0;
        const total = alunos.length;

        for (const aluno of alunos) {
            // 🔑 Criar JWT com dados do aluno
            const token = gerarTokenAluno(aluno);

            const qrCodeDataUrl = await gerarQrCodeComTexto(token, aluno);
            const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");

            // Criar pasta da turma se não existir
            const turmaDir = path.join(qrCodesDir, aluno.turma);
            if (!fs.existsSync(turmaDir)) {
                fs.mkdirSync(turmaDir, { recursive: true });
            }

            const outputFile = path.join(turmaDir, `${aluno.matricula}.png`);
            fs.writeFileSync(outputFile, base64Data, "base64");

            aluno.qrcodeGerado = true;
            aluno.qrCodeGeradoEm = new Date().toISOString();
            gerados++;
            console.log(`QR Code gerado para ${aluno.matricula} (turma ${aluno.turma}) (${gerados}/${total})`);
        }

        // Criar ZIP agrupando todas as turmas
        await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath);
            const archive = archiver("zip", { zlib: { level: 9 } });

            output.on("close", resolve);
            archive.on("error", reject);

            archive.pipe(output);
            archive.directory(qrCodesDir, false); // inclui subpastas (turmas)
            archive.finalize();
        });

        return {
            message: `QR Codes gerados para ${gerados} alunos em ${[...new Set(alunos.map(a => a.turma))].length} turmas. Arquivo compactado disponível em 'qrcodes.zip'.`,
            zipFile: "qrcodes.zip"
        };

    } catch (error) {
        throw new Error(`Erro ao gerar QR Codes em lote: ${error.message}`);
    }
}

module.exports = { gerarQRCodeAluno, gerarQRCodeEmLote };
