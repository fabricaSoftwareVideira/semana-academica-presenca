// Interface para o RankingRepository
const RepositoryInterface = require('./repository.interface');

/**
 * @interface RankingRepositoryInterface
 * @extends RepositoryInterface
 * @method getRanking
 * @method getAll
 * @method saveAll
 */
class RankingRepositoryInterface extends RepositoryInterface {
    getRanking() {
        throw new Error('Método getRanking() não implementado');
    }
}

module.exports = RankingRepositoryInterface;
