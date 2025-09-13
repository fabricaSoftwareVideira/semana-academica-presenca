const express = require('express');
const { listar, cadastrar } = require('../controllers/turmas.controller');

const router = express.Router();

router.get('/', listar);
router.post('/', cadastrar);

module.exports = router;