// Interface específica para repositório de usuários
const RepositoryInterface = require('./repository.interface');

/**
 * @interface UserRepositoryInterface
 * @extends RepositoryInterface
 * @method getAll
 * @method saveAll
 * @method findByUsername
 */
class UserRepositoryInterface extends RepositoryInterface {
    findByUsername(username) {
        throw new Error('Método findByUsername() não implementado');
    }
}

module.exports = UserRepositoryInterface;
