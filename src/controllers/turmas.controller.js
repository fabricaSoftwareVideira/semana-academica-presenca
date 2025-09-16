// cada turma tem   {"id": "1A","nome": "Turma 1A"}

const TurmaModel = require("../models/turma.model");


function listar(req, res) {
    const turmas = TurmaModel.getAllTurmas();
    res.json(turmas);
}


function cadastrar(req, res) {
    const { id, nome } = req.body;
    if (!id || !nome) {
        return res.status(400).json({ error: "id e nome são obrigatórios" });
    }

    const turmas = TurmaModel.getAllTurmas();
    if (turmas.find((t) => t.id === id)) {
        return res.status(400).json({ error: "Turma já cadastrada" });
    }

    const novaTurma = { id, nome };
    turmas.push(novaTurma);
    TurmaModel.saveTurmas(turmas);

    res.json(novaTurma);
}

module.exports = { listar, cadastrar };