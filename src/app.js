require("dotenv").config();
const app = require("./config/express");
require("./config/passport")(app); // configura passport e sessão

// Rotas
app.use("/", require("./routes/home.routes"));
app.use("/ranking", require("./routes/ranking.routes"));
app.use("/alunos", require("./routes/alunos.routes"));
app.use("/eventos", require("./routes/eventos.routes"));
app.use("/turmas", require("./routes/turmas.routes"));
app.use("/participacao", require("./routes/participacao.routes"));
app.use("/qrcode", require("./routes/qrcode.routes"));
app.use("/auth", require("./routes/auth.route"));
app.use("/users", require("./routes/users.routes"));

// Dashboard protegido
app.get("/dashboard", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("dashboard", { user: req.user });
    } else {
        res.redirect("/");
    }
});

// 404
app.use((req, res) => {
    res.status(404).render("404");
});

module.exports = app;
