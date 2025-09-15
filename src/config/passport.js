const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

function getUsers() {
    const data = fs.readFileSync(path.join(__dirname, "../data/users.json"), "utf8");
    return JSON.parse(data);
}

module.exports = (app) => {
    // Sessão
    app.use(session({
        secret: process.env.SESSION_SECRET || "segredo",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60,
            httpOnly: true,
            secure: false,
            sameSite: 'lax'
        }
    }));

    // Passport
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new LocalStrategy(
        (username, password, done) => {
            const users = getUsers();
            const user = users.find(u => u.username === username);
            if (!user) return done(null, false, { message: "Usuário não encontrado" });

            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) return done(err);
                if (!isMatch) return done(null, false, { message: "Senha incorreta" });
                return done(null, user);
            });
        }
    ));

    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => {
        const users = getUsers();
        const user = users.find(u => u.id === id);
        done(null, user);
    });
};
