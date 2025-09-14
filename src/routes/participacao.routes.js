const express = require('express');
const router = express.Router();
const participacaoController = require('../controllers/participacao.controller');
const { ensureAuthenticated, checkAnyRole } = require('../middlewares/auth');
const { verificarToken } = require('../services/jwt.service');

// Proteção de rotas
router.use(ensureAuthenticated);
router.use(checkAnyRole(['admin', 'organizador', 'convidado']));

router.get('/', participacaoController.registrarParticipacaoPage);

router.post('/:eventoId', verificarToken, participacaoController.participarHandler);
router.delete('/:eventoId', verificarToken, participacaoController.cancelarParticipacaoHandler);

router.post('/vitoria/:eventoId/:posicao', verificarToken, participacaoController.registrarVitoriaHandler);
router.delete('/vitoria/:eventoId/:posicao', verificarToken, participacaoController.cancelarVitoriaHandler);

module.exports = router;
