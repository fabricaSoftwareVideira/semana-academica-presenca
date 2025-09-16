
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
        const alunos = this.getAll();
        return alunos.find(a => a.matricula === matricula);
    }
}

module.exports = new AlunoRepository();
