
const express = require("express");
const router = express.Router();
const rankingController = require("../controllers/ranking.controller");
const eventoController = require("../controllers/eventos.controller");
const { ensureAuthenticated, checkRole } = require("../middlewares/auth");
const { userView } = require("../utils/user-view.utils.js");
const respond = require("../utils/respond");

router.get("/", (req, res) => {
    const user = req.user;
    const isAuthenticated = req.isAuthenticated();
    const { ranking } = rankingController.rankingPublico();
    // const eventosPorTipo = eventoController.agruparPorTipo();
    const eventosPorData = eventoController.agruparPorData();
    const rankingExistePontuacao = ranking.some(u => u.pontosTotal > 0);
    respond(req, res, "home", { user: userView(user), ranking, rankingExistePontuacao, eventosPorData, isAuthenticated });
});


module.exports = router;