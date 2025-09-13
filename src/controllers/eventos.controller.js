const path = require("path");
const { readJson, writeJson } = require("../utils/file.utils");

const DATA_FILE = path.join(__dirname, "../data/eventos.json");

function listar(req, res) {
    const eventos = readJson(DATA_FILE);
    res.json(eventos);
}

function cadastrar(req, res) {
    const { id, nome, data } = req.body;
    if (!id || !nome || !data) {
        return res.status(400).json({ error: "id, nome e data são obrigatórios" });
    }

    const eventos = readJson(DATA_FILE);
    if (eventos.find((e) => e.id === id)) {
        return res.status(400).json({ error: "Evento já cadastrado" });
    }

    const novoEvento = { id, nome, data };
    eventos.push(novoEvento);
    writeJson(DATA_FILE, eventos);

    res.json(novoEvento);
}

module.exports = { listar, cadastrar };