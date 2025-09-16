// Interface base para todos os repositórios
// Para JS puro, usamos comentários JSDoc para sugerir a interface

/**
 * @interface RepositoryInterface
 * @method getAll
 * @method saveAll
 */
class RepositoryInterface {
    getAll() {
        throw new Error('Método getAll() não implementado');
    }
    saveAll(data) {
        throw new Error('Método saveAll() não implementado');
    }
}

module.exports = RepositoryInterface;
