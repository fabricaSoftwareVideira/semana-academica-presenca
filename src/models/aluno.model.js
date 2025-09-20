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

/**
 * Busca um aluno pela matrícula
 * @param {string} matricula 
 * @returns {object|null}
 */
function getAlunoByMatricula(matricula) {
    if (!matricula) return null;
    const alunos = getAllAlunos();
    return alunos.find(a => a.matricula === matricula) || null;
}

/**
 * Busca um aluno pelo código
 * @param {string} codigo 
 * @returns {object|null}
 */
function getAlunoByCodigo(codigo) {
    if (!codigo) return null;
    const alunos = getAllAlunos();
    return alunos.find(a => a.codigo === codigo) || null;
}

module.exports = {
    getAllAlunos,
    saveAlunos,
    getAlunoByMatricula,
    getAlunoByCodigo,
};
