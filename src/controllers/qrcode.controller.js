const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const jwt = require("jsonwebtoken");
const { readJson } = require("../utils/file.utils");
const { gerarQrCodeComTexto, gerarPdfTurma } = require("../services/qrcode.service");

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
        if (!fs.existsSync(qrCodesDir)) fs.mkdirSync(qrCodesDir, { recursive: true });

        const alunos = readJson(ALUNO_DATA_FILE);
        const turmas = [...new Set(alunos.map(a => a.turma))];
        let gerados = 0;

        for (const aluno of alunos) {
            const token = gerarTokenAluno(aluno);
            const qrCodeDataUrl = await gerarQrCodeComTexto(token, aluno);
            const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");

            // Pasta da turma
            const turmaDir = path.join(qrCodesDir, aluno.turma);
            if (!fs.existsSync(turmaDir)) fs.mkdirSync(turmaDir, { recursive: true });

            // Salva PNG individual
            const outputFile = path.join(turmaDir, `${aluno.matricula}.png`);
            fs.writeFileSync(outputFile, base64Data, "base64");

            aluno.qrcodeGerado = true;
            aluno.qrCodeGeradoEm = new Date().toISOString();
            gerados++;
            console.log(`QR Code gerado para ${aluno.matricula} (${gerados}/${alunos.length})`);
        }

        // Gerar PDF por turma
        for (const turma of turmas) {
            const alunosDaTurma = alunos.filter(a => a.turma === turma);
            await gerarPdfTurma(turma, alunosDaTurma, qrCodesDir);
        }

        // Criar ZIP incluindo imagens e PDFs
        await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath);
            const archive = archiver("zip", { zlib: { level: 9 } });

            output.on("close", resolve);
            archive.on("error", reject);

            archive.pipe(output);

            // Inclui subpastas com PNGs
            archive.directory(qrCodesDir, false);

            // Inclui PDFs
            for (const turma of turmas) {
                const pdfFile = path.join(__dirname, "../../", `${turma}.pdf`);
                if (fs.existsSync(pdfFile)) {
                    archive.file(pdfFile, { name: `${turma}.pdf` });
                }
            }

            archive.finalize();
        });

        return {
            message: `QR Codes gerados para ${gerados} alunos em ${turmas.length} turmas. PNGs e PDFs compactados em 'qrcodes.zip'.`,
            zipFile: "qrcodes.zip"
        };

    } catch (error) {
        throw new Error(`Erro ao gerar QR Codes e PDFs em lote: ${error.message}`);
    }
}

async function gerarPdfPorTurma() {
    try {
        const alunos = readJson(ALUNO_DATA_FILE);
        const turmas = [...new Set(alunos.map(a => a.turma))];

        for (const turma of turmas) {
            const alunosDaTurma = alunos.filter(a => a.turma === turma);
            await gerarPdfTurma(turma, alunosDaTurma);
        }

        console.log(`PDFs gerados para ${turmas.length} turmas.`);
    } catch (error) {
        throw new Error(`Erro ao gerar PDFs por turma: ${error.message}`);
    }
}

module.exports = { gerarQRCodeAluno, gerarQRCodeEmLote, gerarPdfPorTurma };
