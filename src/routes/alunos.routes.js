const express = require("express");
const router = express.Router();
const alunosController = require("../controllers/alunos.controller");
const { ensureAuthenticated, checkRole } = require("../middlewares/auth");

router.get("/", ensureAuthenticated, checkRole("admin"), alunosController.listar);
router.post("/", ensureAuthenticated, checkRole("admin"), alunosController.cadastrar);

module.exports = router;
