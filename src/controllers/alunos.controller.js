
const AlunoModel = require("../models/aluno.model");


function listar(req, res) {
    const alunos = AlunoModel.getAllAlunos();
    res.json(alunos);
}


function cadastrar(req, res) {
    const { matricula, nome, turma } = req.body;
    if (!matricula || !nome || !turma) {
        return res.status(400).json({ error: "matricula, nome e turma são obrigatórios" });
    }

    const alunos = AlunoModel.getAllAlunos();
    if (alunos.find((a) => a.matricula === matricula)) {
        return res.status(400).json({ error: "Aluno já cadastrado" });
    }

    const novoAluno = { matricula, nome, turma, pontos: 0 };
    alunos.push(novoAluno);
    AlunoModel.saveAlunos(alunos);

    res.json(novoAluno);
}


function atualizarAluno(matricula, dadosAtualizados) {
    const alunos = AlunoModel.getAllAlunos();
    const index = alunos.findIndex((a) => a.matricula === matricula);
    if (index === -1) {
        throw new Error("Aluno não encontrado");
    }
    alunos[index] = { ...alunos[index], ...dadosAtualizados };
    AlunoModel.saveAlunos(alunos);
    return alunos[index];
}

module.exports = { listar, cadastrar, atualizarAluno };
