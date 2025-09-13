const express = require('express');
const router = express.Router();

const rankingController = require("../controllers/ranking.controller");

router.get("/alunos", rankingController.rankingAlunosHandler);
router.get("/turmas", rankingController.rankingTurmasHandler);

module.exports = router;