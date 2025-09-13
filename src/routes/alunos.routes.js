const express = require("express");
const router = express.Router();
const alunosController = require("../controllers/alunos.controller");

router.get("/", alunosController.listar);
router.post("/", alunosController.cadastrar);

module.exports = router;
