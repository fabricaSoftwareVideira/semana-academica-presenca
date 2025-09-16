// src/services/jwt.service.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "chave-secreta";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "1y";

/**
 * Gera um token JWT para o payload fornecido
 * @param {Object} payload - Objeto com matricula, turma, nome
 * @param {String} [expiresIn] - tempo de expiração (opcional)
 * @returns {String} JWT
 */
function gerarToken(payload, expiresIn = JWT_EXPIRATION) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verifica e decodifica o token JWT
 * @param {String} token 
 * @returns {Object} payload decodificado
 * @throws {Error} se token inválido ou expirado
 */
function verificarToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

module.exports = { gerarToken, verificarToken };
