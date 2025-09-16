const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const isProduction = process.env.NODE_ENV === "production";

function getUsers() {
    const data = fs.readFileSync(path.join(__dirname, "../data/users.json"), "utf8");
    return JSON.parse(data);
}

module.exports = (app) => {
    // Configuração para proxies reversos (Nginx)
    if (isProduction) {
        app.set("trust proxy", 1); // Trust first proxy
    }

    // Sessão
    app.use(session({
        secret: process.env.SESSION_SECRET || "segredo",
        resave: false, // Não salvar sessão se não modificada
        saveUninitialized: false, // Não salvar sessão se não modificada
        cookie: {
            maxAge: 1000 * 60 * 60, // 1 hora
            httpOnly: true, // Acessível apenas via HTTP
            secure: process.env.NODE_ENV === "production", // Apenas em HTTPS no ambiente de produção
            sameSite: 'lax' // Protege contra CSRF
        }
    }));

    // Passport
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new LocalStrategy(
        (username, password, done) => {
            const users = getUsers();
            const user = users.find(u => u.username === username);
            if (!user) return done(null, false, { message: "Usuário ou senha incorretos" });

            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) return done(err);
                if (!isMatch) return done(null, false, { message: "Usuário ou senha incorretos" });
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
