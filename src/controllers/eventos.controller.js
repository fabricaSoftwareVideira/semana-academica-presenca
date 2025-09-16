const EventoRepository = require("../repositories/evento.repository.js");
const { validarCadastroEvento } = require("../services/evento.validation.js");

function listar() {
    return EventoRepository.getAll();
}

/**
 * Cadastra um novo evento.
 * @param {*} req
 * @param {*} res 
 * @returns 
 */
function cadastrar(req, res) {
    const dados = req.body;
    const erro = validarCadastroEvento(dados);
    if (erro.error) return res.status(400).json({ error: erro.error });

    const eventos = EventoRepository.getAll();
    const novoEvento = { id: dados.id, nome: dados.nome, data: dados.data };
    eventos.push(novoEvento);
    EventoRepository.saveAll(eventos);
    res.json(novoEvento);
}

/**
 * Agrupa eventos por tipo.
 * @returns Array de eventos agrupados por tipo
 */
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