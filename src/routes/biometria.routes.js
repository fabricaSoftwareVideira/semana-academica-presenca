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

// Debug temporário
router.get('/debug/:username', (req, res) => {
    const UserModel = require('../models/user.model');
    const { username } = req.params;

    console.log('🐛 DEBUG - Verificando usuário:', username);
    const user = UserModel.getUserByUsername(username);
    const credentials = UserModel.getUserWebAuthnCredentials(username);

    res.json({
        userExists: !!user,
        hasWebAuthnProperty: !!user?.webauthnCredentials,
        credentialsCount: credentials.length,
        credentials: credentials.map(c => ({
            id: c.credentialID,
            createdAt: c.createdAt,
            transports: c.transports
        }))
    });
});

module.exports = router;