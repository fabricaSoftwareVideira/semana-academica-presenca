// Middleware para verificar se o usuário precisa alterar a senha
function verificarPrimeiroLogin(req, res, next) {
    if (req.isAuthenticated() && req.user.primeiroLogin) {
        // Se está tentando acessar a página de criar senha, permite
        if (req.path === '/auth/criar-senha' || req.path === '/auth/logout') {
            return next();
        }
        // Caso contrário, redireciona para criar senha
        return res.redirect('/auth/criar-senha');
    } else if (req.path === '/auth/criar-senha' && !req.user?.primeiroLogin) {
        return res.redirect('/dashboard');
    }
    next();
}

module.exports = { verificarPrimeiroLogin };