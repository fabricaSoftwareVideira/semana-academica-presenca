const AuthService = require("../services/auth.service.js");
const AuthValidation = require("../services/auth.validation.js");

exports.loginPage = (req, res) => {
    res.render("login");
};

function efetuarLogin(req, res, next) {
    AuthService.autenticarUsuario(
        req, res, next,
        (user) => {
            if (AuthService.usuarioBloqueado(user)) {
                return res.render("login", { error: "Usuário bloqueado. Contate o administrador." });
            }
            return res.redirect("/dashboard");
        },
        (info) => {
            return res.render("login", { error: info.message });
        }
    );
}

exports.login = (req, res, next) => {
    const { username, password } = req.body;
    const erroPayload = AuthValidation.validarLoginPayload({ username, password });
    if (erroPayload.error) {
        return res.render("login", { error: erroPayload.error });
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
