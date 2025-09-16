

const TurmaRepository = require("../repositories/turma.repository.js");
const { validarCadastroTurma } = require("../services/turma.validation.js");

function listar(req, res) {
    const turmas = TurmaRepository.getAll();
    res.json(turmas);
}



function cadastrar(req, res) {
    const dados = req.body;
    const erro = validarCadastroTurma(dados);
    if (erro.error) return res.status(400).json({ error: erro.error });

    const turmas = TurmaRepository.getAll();
    const novaTurma = { id: dados.id, nome: dados.nome };
    turmas.push(novaTurma);
    TurmaRepository.saveAll(turmas);
    res.json(novaTurma);
}

module.exports = { listar, cadastrar };