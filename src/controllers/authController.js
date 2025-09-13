const passport = require("passport");

exports.loginPage = (req, res) => {
    res.render("login");
};

function efetuarLogin(req, res, next) {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.render("login", { error: info.message });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            // redirecionar para views/dashboard após login bem-sucedido
            // return res.render("dashboard", { user });
            return res.redirect("/dashboard");
        });
    })(req, res, next);
}

exports.login = (req, res, next) => {
    efetuarLogin(req, res, next);
};

// exports.login = passport.authenticate("local", {
//     successRedirect: "/dashboard",   // se sucesso, vai pro dashboard
//     failureRedirect: "/auth/login"   // se erro, volta pro login
// });

exports.logout = (req, res) => {
    req.logout(() => {
        res.redirect("/home");
    });
};
