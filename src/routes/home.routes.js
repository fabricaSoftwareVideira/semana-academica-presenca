const express = require("express");
const router = express.Router();
const rankingController = require("../controllers/ranking.controller");
const eventoController = require("../controllers/eventos.controller");
const { ensureAuthenticated, checkRole } = require("../middlewares/auth");

router.get("/", (req, res) => {
    const user = req.user;
    const isAuthenticated = req.isAuthenticated();
    if (isAuthenticated) {
        return res.redirect("/dashboard");
    }
    // Se não estiver autenticado, mostrar a página pública com o ranking
    const ranking = rankingController.rankingPublico();
    const eventosPorTipo = eventoController.agruparPorTipo();
    const rankingExistePontuacao = ranking.some(u => u.pontosTotal > 0);

    res.render("home", { user, ranking, rankingExistePontuacao, eventosPorTipo, isAuthenticated });
});

module.exports = router;