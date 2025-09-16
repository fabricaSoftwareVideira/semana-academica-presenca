// Interface específica para repositório de alunos
const RepositoryInterface = require('./repository.interface');

/**
 * @interface AlunoRepositoryInterface
 * @extends RepositoryInterface
 * @method getAll
 * @method saveAll
 * @method findByMatricula
 */
class AlunoRepositoryInterface extends RepositoryInterface {
    findByMatricula(matricula) {
        throw new Error('Método findByMatricula() não implementado');
    }
}

module.exports = AlunoRepositoryInterface;
