
const express = require('express');
const { listar, cadastrar } = require('../controllers/users.controller');
const { ensureAuthenticated, checkRole, checkAnyRole } = require('../middlewares/auth');
const respond = require("../utils/respond");
const { userView } = require('../utils/user-view.utils.js');

const router = express.Router();


// Listar usuários
router.get('/', ensureAuthenticated, checkAnyRole(['admin', 'organizador']), (req, res) => {
    const users = require('../repositories/user.repository').getAll();
    // res.render('users', { users });
    respond(req, res, 'users', { users, user: userView(req.user) });
});

// Formulário de novo usuário
router.get('/new', ensureAuthenticated, checkRole('admin'), (req, res) => {
    // res.render('user-new');
    respond(req, res, 'user-new', { user: userView(req.user) });
});

// Criar usuário
router.post('/', ensureAuthenticated, checkRole('admin'), require('../controllers/users.controller').cadastrar);

// Formulário de edição de usuário
router.get('/:id/edit', ensureAuthenticated, checkRole('admin'), require('../controllers/users.controller').editarForm);

// Atualizar usuário
router.post('/:id', ensureAuthenticated, checkRole('admin'), require('../controllers/users.controller').atualizar);

// Deletar usuário
router.post('/:id/delete', ensureAuthenticated, checkRole('admin'), require('../controllers/users.controller').deletar);

module.exports = router;