

const AlunoRepository = require("../repositories/aluno.repository.js");



function listar(req, res) {
    const alunos = AlunoRepository.getAll();
    res.json(alunos);
}




function cadastrar(req, res) {
    const { matricula, nome, turma } = req.body;
    if (!matricula || !nome || !turma) {
        return res.status(400).json({ error: "matricula, nome e turma são obrigatórios" });
    }

    if (AlunoRepository.findByMatricula(matricula)) {
        return res.status(400).json({ error: "Aluno já cadastrado" });
    }

    const alunos = AlunoRepository.getAll();
    const novoAluno = { matricula, nome, turma, pontos: 0 };
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
