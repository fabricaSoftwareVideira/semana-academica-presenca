const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const isProduction = process.env.NODE_ENV === "production";

const { getUserByUsername, getUserById } = require("../services/users.service");

module.exports = (app) => {
    if (isProduction) {
        app.set("trust proxy", 1);
    }

    app.use(session({
        secret: process.env.SESSION_SECRET || "segredo",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60,
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax'
        }
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new LocalStrategy((username, password, done) => {
        const user = getUserByUsername(username);
        if (!user) return done(null, false, { message: "Usuário ou senha incorretos" });

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return done(err);
            if (!isMatch) return done(null, false, { message: "Usuário ou senha incorretos" });
            return done(null, user);
        });
    }));

    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => {
        const user = getUserById(id);
        done(null, user);
    });
};
