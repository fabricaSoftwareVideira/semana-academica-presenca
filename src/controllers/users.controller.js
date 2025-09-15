const path = require("path");
const { readJson, writeJson } = require("../utils/file.utils");

const DATA_FILE = path.join(__dirname, "../data/users.json");

function listar(req, res) {
    const users = readJson(DATA_FILE);
    res.json(users);
}

function login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "username e password são obrigatórios" });
    }

    const users = readJson(DATA_FILE);
    const user = users.find((u) => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
    }
    // Aqui você pode implementar a lógica de sessão ou token
    res.json({ message: "Login bem-sucedido", user });
}

function cadastrar(req, res) {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ error: "username, password e role são obrigatórios" });
    }

    const users = readJson(DATA_FILE);
    if (users.find((u) => u.username === username)) {
        return res.status(400).json({ error: "Usuário já cadastrado" });
    }

    const novoUser = { username, password, role };
    users.push(novoUser);
    writeJson(DATA_FILE, users);

    res.json(novoUser);
}

module.exports = { listar, login, cadastrar };