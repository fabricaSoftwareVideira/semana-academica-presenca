
const AlunoModel = require('../models/aluno.model');
const AlunoRepositoryInterface = require('./aluno.repository.interface');

class AlunoRepository extends AlunoRepositoryInterface {
    getAll() {
        return AlunoModel.getAllAlunos();
    }
    saveAll(alunos) {
        return AlunoModel.saveAlunos(alunos);
    }
    findByMatricula(matricula) {
        if (!matricula) {
            throw new Error("Matrícula inválida");
        }
        return AlunoModel.getAlunoByMatricula(matricula);
    }

    findByCodigo(codigo) {
        if (!codigo) {
            throw new Error("Código inválido");
        }
        return AlunoModel.getAlunoByCodigo(codigo);
    }
}

module.exports = new AlunoRepository();
