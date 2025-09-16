
const UserModel = require("../models/user.model");
const bcrypt = require("bcrypt");


function listar(req, res) {
    const users = UserModel.getAllUsers();
    res.json(users);
}


function login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "username e password são obrigatórios" });

    const users = UserModel.getAllUsers();
    const user = users.find(u => u.username === username);
    if (!user || user.password !== password) {
        return res.status(401).json({ error: "Credenciais inválidas" });
    }
    res.json({ message: "Login bem-sucedido", user });
}


function cadastrar(req, res) {
    const { username, password, role } = req.body;
    if (!username || !password || !role) return res.status(400).json({ error: "username, password e role são obrigatórios" });

    const users = UserModel.getAllUsers();
    if (users.find(u => u.username === username)) return res.status(400).json({ error: "Usuário já cadastrado" });

    const novoUser = { id: Date.now(), username, password, role };
    users.push(novoUser);
    UserModel.saveUsers(users);
    res.json(novoUser);
}

module.exports = { listar, login, cadastrar };
