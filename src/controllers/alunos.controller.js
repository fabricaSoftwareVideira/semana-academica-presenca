
const AlunoRepository = require("../repositories/aluno.repository.js");
const { validarCadastroAluno } = require("../services/aluno.validation.js");

function listar(req, res) {
    const alunos = AlunoRepository.getAll();
    res.json(alunos);
}


function cadastrar(req, res) {
    const dados = req.body;
    const erro = validarCadastroAluno(dados);
    if (erro.error) return res.status(400).json({ error: erro.error });

    const alunos = AlunoRepository.getAll();
    const novoAluno = { matricula: dados.matricula, nome: dados.nome, turma: dados.turma, pontos: 0 };
    alunos.push(novoAluno);
    AlunoRepository.saveAll(alunos);
    res.json(novoAluno);
}

function atualizarAluno(matricula, dadosAtualizados) {
    const alunos = AlunoRepository.getAll();
    const index = alunos.findIndex((a) => a.matricula === matricula);
    if (index === -1) {
        throw new Error("Aluno não encontrado");
    }
    alunos[index] = { ...alunos[index], ...dadosAtualizados };
    AlunoRepository.saveAll(alunos);
    return alunos[index];
}

module.exports = { listar, cadastrar, atualizarAluno };
