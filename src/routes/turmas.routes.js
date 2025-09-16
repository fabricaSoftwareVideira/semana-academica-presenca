
const express = require('express');
const { listar, cadastrar } = require('../controllers/turmas.controller');
const respond = require("../utils/respond");

const router = express.Router();

router.get('/', (req, res) => {
    const turmas = require('../repositories/turma.repository').getAll();
    respond(req, res, 'turmas', { turmas });
});
router.post('/', cadastrar);

module.exports = router;