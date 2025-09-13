const express = require("express");
const path = require("path");
const session = require("express-session");

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const fs = require("fs");

const alunosRoutes = require("./routes/alunos.routes");
const eventosRoutes = require("./routes/eventos.routes");
const turmasRoutes = require("./routes/turmas.routes");
const participacaoRoutes = require("./routes/participacao.routes");
const rankingRoutes = require("./routes/ranking.routes");
const qrcodeRoutes = require("./routes/qrcode.routes");
const authRoutes = require("./routes/auth.route");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(session({
    secret: process.env.SESSION_SECRET || "segredo",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Rotas
app.get("/", (req, res) => res.redirect("/auth/login"));
app.get("/dashboard", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("dashboard", { user: req.user });
    } else {
        res.redirect("/login");
    }
});

app.use("/alunos", alunosRoutes);
app.use("/eventos", eventosRoutes);
app.use("/turmas", turmasRoutes);
app.use("/participacao", participacaoRoutes);
app.use("/ranking", rankingRoutes);
app.use("/qrcode", qrcodeRoutes);
app.use("/auth", authRoutes);

// Carregar usuários do JSON
function getUsers() {
    const data = fs.readFileSync(path.join(__dirname, "./data/users.json"), "utf8");
    return JSON.parse(data);
}

// Estratégia local
passport.use(new LocalStrategy(
    (username, password, done) => {
        const users = getUsers();
        const user = users.find(u => u.username === username);
        if (!user) {
            return done(null, false, { message: "Usuário não encontrado" });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return done(err);
            if (!isMatch) return done(null, false, { message: "Senha incorreta" });
            return done(null, user);
        });
    }
));

// Serialização
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
    const users = getUsers();
    const user = users.find(u => u.id === id);
    done(null, user);
});

// Rota para página não encontrada e renderizar uma view 404.ejs
app.use((req, res) => {
    res.status(404).render("404");

});

module.exports = app;
