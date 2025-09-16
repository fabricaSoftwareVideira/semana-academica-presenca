// Exemplo de AuthService para lógica extra de autenticação
const passport = require('passport');

function autenticarUsuario(req, res, next, onSuccess, onFail) {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return onFail(info);
        req.logIn(user, (err) => {
            if (err) return next(err);
            return onSuccess(user);
        });
    })(req, res, next);
}

// Exemplo de regra extra: bloquear usuário
function usuarioBloqueado(user) {
    // Exemplo: return true se o usuário estiver bloqueado
    return user && user.bloqueado;
}

module.exports = {
    autenticarUsuario,
    usuarioBloqueado
};
