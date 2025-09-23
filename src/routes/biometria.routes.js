const express = require('express');
const router = express.Router();
const biometriaController = require('../controllers/biometria.controller');
const { ensureAuthenticated } = require('../middlewares/auth');

// Rotas protegidas (requerem autenticação tradicional)
router.post('/registrar/iniciar', ensureAuthenticated, biometriaController.iniciarRegistroBiometria);
router.post('/registrar/finalizar', ensureAuthenticated, biometriaController.finalizarRegistroBiometria);
router.get('/credenciais', ensureAuthenticated, biometriaController.listarCredenciais);
router.delete('/credenciais/:credentialId', ensureAuthenticated, biometriaController.removerCredencial);

// Rotas públicas (para autenticação)
router.post('/autenticar/iniciar', biometriaController.iniciarAutenticacaoBiometria);
router.post('/autenticar/finalizar', biometriaController.finalizarAutenticacaoBiometria);

module.exports = router; module.exports = router;