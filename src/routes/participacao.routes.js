const express = require('express');
const router = express.Router();
const participacaoController = require('../controllers/participacao.controller');
const { ensureAuthenticated, checkAnyRole } = require('../middlewares/auth');
const { jwtMiddleware } = require('../middlewares/jwt.middleware');

// Proteção de rotas
router.use(ensureAuthenticated);
router.use(checkAnyRole(['admin', 'organizador', 'convidado']));

router.get('/', participacaoController.registrarParticipacaoPage);

router.post('/:eventoId', jwtMiddleware, participacaoController.participarHandler);
router.delete('/:eventoId', jwtMiddleware, participacaoController.cancelarParticipacaoHandler);

router.post('/vitoria/:eventoId/:posicao', jwtMiddleware, participacaoController.registrarVitoriaHandler);
router.delete('/vitoria/:eventoId/:posicao', jwtMiddleware, participacaoController.cancelarVitoriaHandler);

module.exports = router;