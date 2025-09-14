const express = require('express');
const router = express.Router();
const participacaoController = require('../controllers/participacao.controller');
const { ensureAuthenticated, checkRole, checkAnyRole } = require('../middlewares/auth');

// Rotas protegidas por autenticação e autorização
router.use(ensureAuthenticated);
router.use(checkAnyRole(['admin', 'organizador', 'convidado']));

// Rotas de participação e vitória
router.get('/', participacaoController.registrarParticipacaoPage);
router.post('/:matricula/:eventoId', participacaoController.participarHandler);
router.delete('/:matricula/:eventoId', participacaoController.cancelarParticipacaoHandler);
router.post('/vitoria/:matricula/:eventoId/:posicao', participacaoController.registrarVitoriaHandler);
router.delete('/vitoria/:matricula/:eventoId/:posicao', participacaoController.cancelarVitoriaHandler);

module.exports = router;