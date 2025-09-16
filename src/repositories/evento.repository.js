const EventoModel = require('../models/evento.model');

const EventoRepository = {
    getAll: () => EventoModel.getAllEventos(),
    saveAll: (eventos) => EventoModel.saveEventos(eventos),
};

module.exports = EventoRepository;
