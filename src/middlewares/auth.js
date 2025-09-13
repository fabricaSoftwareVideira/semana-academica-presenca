function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    // return res.redirect("/auth/login");
    return res.status(401).render("/auth/login", { message: "Por favor, faça login para continuar." });
}

function checkRole(role) {
    return function (req, res, next) {
        console.log(req.user);
        if (req.isAuthenticated() && req.user.role === role) {
            return next();
        }
        return res.status(403).render("error", { message: "Acesso negado" });
    };
}

function checkAnyRole(roles) {
    return function (req, res, next) {
        console.log("=== checkAnyRole ===");
        console.log("Usuário autenticado:", req.isAuthenticated());
        console.log("req.user:", req.user);

        if (req.isAuthenticated() && req.user && roles.includes(req.user.role)) {
            console.log(`Acesso permitido para ${req.user.username} com role ${req.user.role}`);
            return next();
        }

        console.log(`Acesso negado para usuário ${req.user ? req.user.username : 'desconhecido'}`);
        return res.status(403).render("error", { message: "Acesso negado" });
    };
}

module.exports = { ensureAuthenticated, checkRole, checkAnyRole };