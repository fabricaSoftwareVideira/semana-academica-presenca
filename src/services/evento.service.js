const EventoRepository = require('../repositories/evento.repository.js');

function validarEventoPayload({ id, nome, data }) {
    if (!id || !nome || !data) {
        return { error: 'id, nome e data são obrigatórios' };
    }
    return {};
}

function eventoJaExiste(id) {
    if (EventoRepository.findById(id)) {
        return { error: 'Evento já cadastrado' };
    }
    return {};
}

module.exports = {
    validarEventoPayload,
    eventoJaExiste
};
