const UserRepository = require('../repositories/user.repository.js');

function validarUserPayload({ username, password, role }) {
    if (!username || !password || !role) {
        return { error: 'username, password e role são obrigatórios' };
    }
    return {};
}

function userJaExiste(username) {
    if (UserRepository.findByUsername(username)) {
        return { error: 'Usuário já cadastrado' };
    }
    return {};
}

function validarLogin({ username, password }) {
    if (!username || !password) {
        return { error: 'username e password são obrigatórios' };
    }
    return {};
}

module.exports = {
    validarUserPayload,
    userJaExiste,
    validarLogin
};
