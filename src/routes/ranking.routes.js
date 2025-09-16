const express = require('express');
const router = express.Router();

const rankingController = require("../controllers/ranking.controller");
const { ensureAuthenticated, checkRole } = require("../middlewares/auth");

router.get("/alunos", ensureAuthenticated, rankingController.rankingAlunosHandler);
router.get("/turmas", ensureAuthenticated, rankingController.rankingTurmasHandler);
router.get("/", (req, res) => {
    const user = req.user;
    const { ranking, vitoriasOrdenadas } = rankingController.rankingPublico();

    res.render("ranking", { ranking, user, vitoriasOrdenadas });
});

module.exports = router;