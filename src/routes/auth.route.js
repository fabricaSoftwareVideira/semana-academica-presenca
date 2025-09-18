const express = require("express");
const router = express.Router();
const { loginPage, login, logout, criarSenhaPage, criarSenha, alterarSenhaPage, alterarSenha } = require("../controllers/auth.controller");

// Se estiver logado então redireciona para o dashboard
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/dashboard");
    }
    next();
}

// Middleware para verificar se está autenticado
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/auth/login");
}

// Middleware para verificar se o usuário precisa alterar a senha
function verificarPrimeiroLogin(req, res, next) {
    if (req.isAuthenticated() && req.user.primeiroLogin) {
        // Se está tentando acessar a página de criar senha, permite
        if (req.path === '/criar-senha' || req.path === '/logout') {
            return next();
        }
        // Caso contrário, redireciona para criar senha
        return res.redirect('/auth/criar-senha');
    }
    res.redirect('/');
}

router.get("/login", checkNotAuthenticated, loginPage);
router.post("/login", login);
router.get("/logout", logout);
router.get("/criar-senha", verificarPrimeiroLogin, criarSenhaPage);
router.post("/criar-senha", verificarPrimeiroLogin, criarSenha);
router.get("/alterar-senha", checkAuthenticated, alterarSenhaPage);
router.post("/alterar-senha", checkAuthenticated, alterarSenha);

module.exports = router;
