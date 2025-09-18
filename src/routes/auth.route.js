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

router.get("/login", checkNotAuthenticated, loginPage);
router.post("/login", login);
router.get("/logout", logout);
router.get("/criar-senha", checkAuthenticated, criarSenhaPage);
router.post("/criar-senha", checkAuthenticated, criarSenha);
router.get("/alterar-senha", checkAuthenticated, alterarSenhaPage);
router.post("/alterar-senha", checkAuthenticated, alterarSenha);

module.exports = router;
