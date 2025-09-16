const EventoModel = require('../models/evento.model');


const EventoRepository = {
    getAll: () => EventoModel.getAllEventos(),
    saveAll: (eventos) => EventoModel.saveEventos(eventos),
    findById: (id) => {
        const eventos = EventoModel.getAllEventos();
        return eventos.find(e => e.id === id);
    }
};

module.exports = EventoRepository;
