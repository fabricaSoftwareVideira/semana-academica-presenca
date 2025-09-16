const { isAnyRole, getRole } = require('../utils/auth.utils.js');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    // return res.redirect("/auth/login");
    // return res.status(401).render("/auth/login", { message: "Por favor, faça login para continuar." });
    return res.status(401).render("error", { message: "Por favor, faça login para continuar." });
}

function checkRole(role) {
    return function (req, res, next) {
        if (req.isAuthenticated() && isAnyRole(req.user, [role])) {
            return next();
        }
        return res.status(403).render("error", { message: "Acesso negado" });
    };
}

function checkAnyRole(roles) {
    return function (req, res, next) {
        if (req.isAuthenticated() && isAnyRole(req.user, roles)) {
            console.log(`Acesso permitido para ${req.user.username} com role ${getRole(req.user)}`);
            return next();
        }
        console.log(`Acesso negado para usuário ${req.user ? req.user.username : 'desconhecido'}`);
        return res.status(403).render("error", { message: "Acesso negado" });
    };
}

module.exports = { ensureAuthenticated, checkRole, checkAnyRole };