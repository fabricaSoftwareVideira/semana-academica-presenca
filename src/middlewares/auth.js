function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    return res.redirect("/auth/login");
}

function checkRole(role) {
    return function (req, res, next) {
        if (req.isAuthenticated() && req.user.role === role) {
            return next();
        }
        return res.status(403).render("error", { message: "Acesso negado" });
    };
}

function checkAnyRole(roles) {
    return function (req, res, next) {
        if (req.isAuthenticated() && roles.includes(req.user.role)) {
            return next();
        }
        return res.status(403).render("error", { message: "Acesso negado" });
    };
}

module.exports = { ensureAuthenticated, checkRole, checkAnyRole };