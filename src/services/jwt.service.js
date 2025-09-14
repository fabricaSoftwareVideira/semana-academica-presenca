const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "chave-secreta";

function verificarToken(req, res, next) {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ error: "Token não fornecido" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.alunoDecoded = decoded; // 🔑 disponibiliza matrícula, turma, nome
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token inválido ou expirado" });
    }
}

module.exports = { verificarToken };
