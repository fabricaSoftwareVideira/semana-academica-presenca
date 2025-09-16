const AuthService = require("../services/auth.service.js");
const AuthValidation = require("../services/auth.validation.js");
const { userView } = require('../utils/user-view.utils.js');

exports.loginPage = (req, res) => {
    res.render("login", { user: userView(req.user) });
};

function efetuarLogin(req, res, next) {
    AuthService.autenticarUsuario(
        req, res, next,
        (user) => {
            if (AuthService.usuarioBloqueado(user)) {
                return res.render("login", { error: "Usuário bloqueado. Contate o administrador.", user: userView(user) });
            }
            return res.redirect("/dashboard");
        },
        (info) => {
            return res.render("login", { error: info.message, user: userView(req.user) });
        }
    );
}

exports.login = (req, res, next) => {
    const { username, password } = req.body;
    const erroPayload = AuthValidation.validarLoginPayload({ username, password });
    if (erroPayload.error) {
        return res.render("login", { error: erroPayload.error, user: userView(req.user) });
    }
    efetuarLogin(req, res, next);
};

// exports.login = passport.authenticate("local", {
//     successRedirect: "/dashboard",   // se sucesso, vai pro dashboard
//     failureRedirect: "/auth/login"   // se erro, volta pro login
// });

exports.logout = (req, res) => {
    req.logout(() => {
        res.redirect("/");
    });
};
