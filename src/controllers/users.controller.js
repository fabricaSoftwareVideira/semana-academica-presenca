const { getAllUsers, getUserByUsername, addUser } = require("../services/users.service");
const bcrypt = require("bcrypt");

function listar(req, res) {
    const users = getAllUsers();
    res.json(users);
}

function login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "username e password são obrigatórios" });

    const user = getUserByUsername(username);
    if (!user || user.password !== password) {
        return res.status(401).json({ error: "Credenciais inválidas" });
    }
    res.json({ message: "Login bem-sucedido", user });
}

function cadastrar(req, res) {
    const { username, password, role } = req.body;
    if (!username || !password || !role) return res.status(400).json({ error: "username, password e role são obrigatórios" });

    if (getUserByUsername(username)) return res.status(400).json({ error: "Usuário já cadastrado" });

    const novoUser = { id: Date.now(), username, password, role };
    addUser(novoUser);
    res.json(novoUser);
}

module.exports = { listar, login, cadastrar };
