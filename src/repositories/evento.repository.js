const EventoModel = require('../models/evento.model');

const EventoRepository = {
    getAll: () => EventoModel.getAllEventos(),
    saveAll: (eventos) => EventoModel.saveEventos(eventos),
    findById(id) {
        if (!id) {
            throw new Error("ID de evento inválido");
        }
        return EventoModel.getEventoById(id);
    }
};

module.exports = EventoRepository;
