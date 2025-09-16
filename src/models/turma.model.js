const fs = require('fs');
const path = require('path');

const TURMAS_PATH = path.join(__dirname, '../data/turmas.json');

function getAllTurmas() {
    const data = fs.readFileSync(TURMAS_PATH, 'utf-8');
    return JSON.parse(data);
}

function saveTurmas(turmas) {
    fs.writeFileSync(TURMAS_PATH, JSON.stringify(turmas, null, 2));
}

module.exports = {
    getAllTurmas,
    saveTurmas,
};
