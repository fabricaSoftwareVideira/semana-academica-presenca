const express = require('express');
const { listar, login, cadastrar } = require('../controllers/users.controller');
const { ensureAuthenticated, checkRole } = require('../middlewares/auth');

const router = express.Router();

// Rota para listar usuários (apenas para administradores)
router.get('/', ensureAuthenticated, checkRole('admin2'), listar);

// Rota para cadastrar novo usuário (apenas para administradores)
router.post('/cadastrar', ensureAuthenticated, checkRole('admin'), cadastrar);

module.exports = router;