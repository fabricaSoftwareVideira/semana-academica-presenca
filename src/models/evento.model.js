const fs = require('fs');
const path = require('path');

const EVENTOS_PATH = path.join(__dirname, '../data/eventos.json');

function getAllEventos() {
    const data = fs.readFileSync(EVENTOS_PATH, 'utf-8');
    return JSON.parse(data);
}

function saveEventos(eventos) {
    fs.writeFileSync(EVENTOS_PATH, JSON.stringify(eventos, null, 2));
}

/**
 * Busca um evento pelo ID
 * @param {number} id 
 * @returns {object|null}
 */
function getEventoById(id) {
    if (!id) return null;
    const eventos = getAllEventos();
    return eventos.find(e => e.id === id) || null;
}

module.exports = {
    getAllEventos,
    saveEventos,
    getEventoById,
};
