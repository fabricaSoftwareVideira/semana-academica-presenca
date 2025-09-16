
const express = require("express");
const router = express.Router();
const alunosController = require("../controllers/alunos.controller");
const { ensureAuthenticated, checkRole } = require("../middlewares/auth");
const respond = require("../utils/respond");

router.get("/", ensureAuthenticated, checkRole("admin"), (req, res) => {
    const alunos = require('../repositories/aluno.repository').getAll();
    respond(req, res, 'alunos', { alunos });
});
router.post("/", ensureAuthenticated, checkRole("admin"), alunosController.cadastrar);

module.exports = router;
