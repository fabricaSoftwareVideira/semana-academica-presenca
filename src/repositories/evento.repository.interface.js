// Interface específica para repositório de eventos
const RepositoryInterface = require('./repository.interface');

/**
 * @interface EventoRepositoryInterface
 * @extends RepositoryInterface
 * @method getAll
 * @method saveAll
 * @method findById
 */
class EventoRepositoryInterface extends RepositoryInterface {
    findById(id) {
        throw new Error('Método findById() não implementado');
    }
}

module.exports = EventoRepositoryInterface;
