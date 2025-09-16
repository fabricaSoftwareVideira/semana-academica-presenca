// Interface específica para repositório de turmas
const RepositoryInterface = require('./repository.interface');

/**
 * @interface TurmaRepositoryInterface
 * @extends RepositoryInterface
 * @method getAll
 * @method saveAll
 * @method findById
 */
class TurmaRepositoryInterface extends RepositoryInterface {
    findById(id) {
        throw new Error('Método findById() não implementado');
    }
}

module.exports = TurmaRepositoryInterface;
