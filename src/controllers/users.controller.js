const UserRepository = require("../repositories/user.repository.js");
const UserService = require("../services/user.service.js");
const respond = require("../utils/respond.js");
const { userView } = require('../utils/user-view.utils.js');
const bcrypt = require('bcrypt');

function listar(req, res) {
    const users = UserRepository.getAll();
    res.json(users);
}

function login(req, res) {
    const { username, password } = req.body;
    const erroLogin = UserService.validarLogin({ username, password });
    if (erroLogin.error) return res.status(400).json({ error: erroLogin.error });

    const user = UserRepository.findByUsername(username);
    if (!user || user.password !== password) {
        return res.status(401).json({ error: "Credenciais inválidas" });
    }
    res.json({ message: "Login bem-sucedido", user: userView(user) });
}

function cadastrar(req, res) {
    const { username, password, role } = req.body;
    const erroPayload = UserService.validarUserPayload({ username, password, role });
    if (erroPayload.error) return respond(req, res, 'user-new', { error: erroPayload.error, user: userView(req.user) }, 400);

    const erroExistente = UserService.userJaExiste(username);
    console.log(erroExistente);

    if (erroExistente.error) return respond(req, res, 'user-new', { error: erroExistente.error, user: userView(req.user) }, 400);

    const users = UserRepository.getAll();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const novoUser = { id: UserRepository.getNextId(), username, password: hashedPassword, role };
    users.push(novoUser);
    UserRepository.saveAll(users);

    respond(req, res, 'users', { message: "Usuário cadastrado com sucesso", users: users }, 201);
}


function editarForm(req, res) {
    const users = UserRepository.getAll();
    const user = users.find(u => u.id == req.params.id);
    if (!user) return respond(req, res, 'user-edit', { error: 'Usuário não encontrado' }, 404);
    respond(req, res, 'user-edit', { user: userView(user) });
}

function atualizar(req, res) {
    const users = UserRepository.getAll();
    const idx = users.findIndex(u => u.id == req.params.id);
    if (idx === -1) return respond(req, res, 'user-edit', { error: 'Usuário não encontrado' }, 404);

    // Verificar se o novo username já existe em outro usuário
    const existingUser = users.find(u => u.username === req.body.username && u.id != req.params.id);
    if (existingUser) {
        return respond(req, res, 'user-edit', { error: 'Nome de usuário já existe', user: userView(users[idx]) }, 400);
    }

    users[idx].username = req.body.username;
    users[idx].role = req.body.role;
    // Não atualiza senha por aqui
    UserRepository.saveAll(users);
    res.redirect('/users');
}

function deletar(req, res) {
    let users = UserRepository.getAll();
    users = users.filter(u => u.id != req.params.id);
    UserRepository.saveAll(users);
    res.redirect('/users');
}

module.exports = { listar, login, cadastrar, editarForm, atualizar, deletar };
