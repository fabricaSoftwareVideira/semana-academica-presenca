
const EventoModel = require("../models/evento.model");


function listar() {
    const eventos = EventoModel.getAllEventos();
    return eventos;
}


function cadastrar(req, res) {
    const { id, nome, data } = req.body;
    if (!id || !nome || !data) {
        return res.status(400).json({ error: "id, nome e data são obrigatórios" });
    }

    const eventos = EventoModel.getAllEventos();
    if (eventos.find((e) => e.id === id)) {
        return res.status(400).json({ error: "Evento já cadastrado" });
    }

    const novoEvento = { id, nome, data };
    eventos.push(novoEvento);
    EventoModel.saveEventos(eventos);

    res.json(novoEvento);
}


// Agrupar uma lista de eventos por tipo (palestra, oficina, etc.) - Exemplo simples
function agruparPorTipo() {
    const eventos = EventoModel.getAllEventos();
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