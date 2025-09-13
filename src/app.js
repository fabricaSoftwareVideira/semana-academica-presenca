const express = require("express");
const path = require("path");

const alunosRoutes = require("./routes/alunos.routes");
const eventosRoutes = require("./routes/eventos.routes");
const turmasRoutes = require("./routes/turmas.routes");
const participacaoRoutes = require("./routes/participacao.routes");
const rankingRoutes = require("./routes/ranking.routes");
const qrcodeRoutes = require("./routes/qrcode.routes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Rotas
app.get("/", (req, res) => res.redirect("/login"));
app.get("/login", (req, res) => res.render("login"));

app.use("/alunos", alunosRoutes);
app.use("/eventos", eventosRoutes);
app.use("/turmas", turmasRoutes);
app.use("/participacao", participacaoRoutes);
app.use("/ranking", rankingRoutes);
app.use("/qrcode", qrcodeRoutes);

// Rota para página não encontrada
app.use((req, res) => {
    res.status(404).render("404");
});

module.exports = app;
