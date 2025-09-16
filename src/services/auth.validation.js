function validarLoginPayload({ username, password }) {
    if (!username || !password) {
        return { error: 'username e password são obrigatórios' };
    }
    return {};
}

module.exports = {
    validarLoginPayload
};
