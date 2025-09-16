const AlunoRepository = require('../repositories/aluno.repository.js');
const EventoRepository = require('../repositories/evento.repository.js');

function validarAluno(matricula) {
    const aluno = AlunoRepository.findByMatricula(matricula);
    if (!aluno) {
        return { error: 'Aluno não encontrado' };
    }
    return { aluno };
}

function validarEvento(eventoId) {
    const evento = EventoRepository.findById(parseInt(eventoId));
    if (!evento) {
        return { error: 'Evento não encontrado' };
    }
    return { evento };
}

function validarParticipacao(aluno, evento) {
    if (aluno.participacoes && aluno.participacoes.find((p) => p.id === evento.id)) {
        return { error: 'Participação já registrada', aluno };
    }
    return {};
}

module.exports = {
    validarAluno,
    validarEvento,
    validarParticipacao
};
