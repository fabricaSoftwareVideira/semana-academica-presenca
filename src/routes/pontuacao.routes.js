const express = require('express');
const router = express.Router();
const pontuacaoController = require('../controllers/pontuacao.controller');

router.get('/', pontuacaoController.pontuacaoPage);
router.post('/', pontuacaoController.lerPontuacao);

module.exports = router;
