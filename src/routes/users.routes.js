const express = require('express');
const { listar, cadastrar } = require('../controllers/users.controller');
const { ensureAuthenticated, checkRole, checkAnyRole } = require('../middlewares/auth');

const router = express.Router();

// Rota para listar usuários (apenas para administradores)
router.get('/', ensureAuthenticated, checkAnyRole(['admin', 'organizador']), listar);

// Rota para cadastrar novo usuário (apenas para administradores)
router.post('/cadastrar', ensureAuthenticated, checkRole('admin'), cadastrar);

module.exports = router;