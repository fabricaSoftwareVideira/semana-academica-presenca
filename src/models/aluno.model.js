const fs = require('fs');
const path = require('path');

const ALUNOS_PATH = path.join(__dirname, '../data/alunos.json');

function getAllAlunos() {
    const data = fs.readFileSync(ALUNOS_PATH, 'utf-8');
    return JSON.parse(data);
}

function saveAlunos(alunos) {
    fs.writeFileSync(ALUNOS_PATH, JSON.stringify(alunos, null, 2));
}

module.exports = {
    getAllAlunos,
    saveAlunos,
};
