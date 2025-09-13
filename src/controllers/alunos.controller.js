const path = require("path");
const { readJson, writeJson } = require("../utils/file.utils");

const DATA_FILE = path.join(__dirname, "../data/alunos.json");

function listar(req, res) {
    const alunos = readJson(DATA_FILE);
    res.json(alunos);
}

function cadastrar(req, res) {
    const { matricula, nome, turma } = req.body;
    if (!matricula || !nome || !turma) {
        return res.status(400).json({ error: "matricula, nome e turma são obrigatórios" });
    }

    const alunos = readJson(DATA_FILE);
    if (alunos.find((a) => a.matricula === matricula)) {
        return res.status(400).json({ error: "Aluno já cadastrado" });
    }

    const novoAluno = { matricula, nome, turma, pontos: 0 };
    alunos.push(novoAluno);
    writeJson(DATA_FILE, alunos);

    res.json(novoAluno);
}

function atualizarAluno(matricula, dadosAtualizados) {
    const alunos = readJson(DATA_FILE);
    const index = alunos.findIndex((a) => a.matricula === matricula);
    if (index === -1) {
        throw new Error("Aluno não encontrado");
    }
    alunos[index] = { ...alunos[index], ...dadosAtualizados };
    writeJson(DATA_FILE, alunos);
    return alunos[index];
}

module.exports = { listar, cadastrar, atualizarAluno };
