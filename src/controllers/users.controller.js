const UserRepository = require("../repositories/user.repository.js");
const UserService = require("../services/user.service.js");
const { userView } = require('../utils/user-view.utils.js');

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
    if (erroPayload.error) return res.status(400).json({ error: erroPayload.error });

    const erroExistente = UserService.userJaExiste(username);
    if (erroExistente.error) return res.status(400).json({ error: erroExistente.error });

    const users = UserRepository.getAll();
    const novoUser = { id: Date.now(), username, password, role };
    users.push(novoUser);
    UserRepository.saveAll(users);
    res.json(novoUser);
}

module.exports = { listar, login, cadastrar };
