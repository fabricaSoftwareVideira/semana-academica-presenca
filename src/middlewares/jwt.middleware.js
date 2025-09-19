const { verificarToken } = require("../services/jwt.service");

function jwtMiddleware(req, res, next) {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token não fornecido" });

    try {
        const decoded = verificarToken(token);
        req.alunoDecoded = decoded; // código, turma, nome
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token inválido ou expirado" });
    }
}

module.exports = { jwtMiddleware };
