const express = require('express');
const router = express.Router();
const participacaoController = require('../controllers/participacao.controller');

router.post('/participar/:matricula/:eventoId', participacaoController.participarHandler);
router.delete('/participacao/:matricula/:eventoId', participacaoController.cancelarParticipacaoHandler);
router.post('/vitoria/:turmaId/:eventoId/:posicao', participacaoController.registrarVitoriaHandler);
router.delete('/vitoria/:turmaId/:eventoId/:posicao', participacaoController.cancelarVitoriaHandler);

module.exports = router;