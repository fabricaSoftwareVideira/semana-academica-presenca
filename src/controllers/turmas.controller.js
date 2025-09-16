
const TurmaRepository = require("../repositories/turma.repository.js");
const TurmaService = require("../services/turma.service.js");

function listar(req, res) {
    const turmas = TurmaRepository.getAll();
    res.json(turmas);
}


function cadastrar(req, res) {
    const { id, nome } = req.body;
    const erroPayload = TurmaService.validarTurmaPayload({ id, nome });
    if (erroPayload.error) {
        return res.status(400).json({ error: erroPayload.error });
    }

    const erroExistente = TurmaService.turmaJaExiste(id);
    if (erroExistente.error) {
        return res.status(400).json({ error: erroExistente.error });
    }

    const turmas = TurmaRepository.getAll();
    const novaTurma = { id, nome };
    turmas.push(novaTurma);
    TurmaRepository.saveAll(turmas);

    res.json(novaTurma);
}

module.exports = { listar, cadastrar };