// cada turma tem   {"id": "1A","nome": "Turma 1A"}
const path = require("path");
const { readJson, writeJson } = require("../utils/file.utils");

const DATA_FILE = path.join(__dirname, "../data/turmas.json");

function listar(req, res) {
    const turmas = readJson(DATA_FILE);
    res.json(turmas);
}

function cadastrar(req, res) {
    const { id, nome } = req.body;
    if (!id || !nome) {
        return res.status(400).json({ error: "id e nome são obrigatórios" });
    }

    const turmas = readJson(DATA_FILE);
    if (turmas.find((t) => t.id === id)) {
        return res.status(400).json({ error: "Turma já cadastrada" });
    }

    const novaTurma = { id, nome };
    turmas.push(novaTurma);
    writeJson(DATA_FILE, turmas);

    res.json(novaTurma);
}

module.exports = { listar, cadastrar };