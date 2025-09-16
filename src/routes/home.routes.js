const express = require("express");
const router = express.Router();
const rankingController = require("../controllers/ranking.controller");
const eventoController = require("../controllers/eventos.controller");
const { ensureAuthenticated, checkRole } = require("../middlewares/auth");
const { userView } = require("../utils/user-view.utils.js");

router.get("/", (req, res) => {
    const user = req.user; // Passport preenche req.user quando logado
    const isAuthenticated = req.isAuthenticated();

    const { ranking } = rankingController.rankingPublico();
    const eventosPorTipo = eventoController.agruparPorTipo();
    const rankingExistePontuacao = ranking.some(u => u.pontosTotal > 0);

    res.render("home", { user: userView(user), ranking, rankingExistePontuacao, eventosPorTipo, isAuthenticated });
});


module.exports = router;