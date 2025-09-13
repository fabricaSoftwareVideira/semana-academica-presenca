const express = require('express');
const router = express.Router();

const rankingController = require("../controllers/ranking.controller");
const { ensureAuthenticated, checkRole } = require("../middlewares/auth");

router.get("/alunos", ensureAuthenticated, rankingController.rankingAlunosHandler);
router.get("/turmas", ensureAuthenticated, rankingController.rankingTurmasHandler);
router.get("/publico", rankingController.rankingPublicoHandler);

module.exports = router;