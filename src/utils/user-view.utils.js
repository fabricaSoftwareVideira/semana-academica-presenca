// Centraliza a criação do objeto userView para views EJS
const { isAdmin, isOrganizador, isConvidado } = require('./auth.utils.js');

function userView(user) {
    if (!user) return undefined;
    return {
        ...user,
        isAdmin: isAdmin(user),
        isOrganizador: isOrganizador(user),
        isConvidado: isConvidado(user)
    };
}

module.exports = { userView };
