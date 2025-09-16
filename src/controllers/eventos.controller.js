
const EventoRepository = require("../repositories/evento.repository.js");
const EventoService = require("../services/evento.service.js");

function listar() {
    return EventoRepository.getAll();
}


function cadastrar(req, res) {
    const { id, nome, data } = req.body;
    const erroPayload = EventoService.validarEventoPayload({ id, nome, data });
    if (erroPayload.error) {
        return res.status(400).json({ error: erroPayload.error });
    }

    const erroExistente = EventoService.eventoJaExiste(id);
    if (erroExistente.error) {
        return res.status(400).json({ error: erroExistente.error });
    }

    const eventos = EventoRepository.getAll();
    const novoEvento = { id, nome, data };
    eventos.push(novoEvento);
    EventoRepository.saveAll(eventos);

    res.json(novoEvento);
}



// Agrupar uma lista de eventos por tipo (palestra, oficina, etc.) - Exemplo simples
function agruparPorTipo() {
    const eventos = EventoRepository.getAll();
    const eventosPorTipo = eventos.reduce((acc, evento) => {
        const tipo = evento.tipo || "Outros";
        if (!acc[tipo]) {
            acc[tipo] = [];
        }
        acc[tipo].push(evento);
        return acc;
    }, {});

    // Converter o objeto em um array para facilitar a iteração na view
    return Object.keys(eventosPorTipo).map((tipo) => ({
        tipo,
        eventos: eventosPorTipo[tipo],
    }));
}

module.exports = { listar, cadastrar, agruparPorTipo };