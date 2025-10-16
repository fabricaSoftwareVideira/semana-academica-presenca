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

/**
 * Agrupar por data
 */
function agruparPorData() {
    const eventos = EventoRepository.getAll();

    // Reduz os eventos em grupos por data
    const eventosPorData = eventos.reduce((acc, evento) => {
        const data = evento.data || "Sem Data";

        if (!acc[data]) {
            acc[data] = [];
        }

        // Corrige o timezone e formata a data em pt-BR
        let dataFormatada = "Sem data definida";
        if (evento.data) {
            const partes = evento.data.split("-"); // ["2025", "11", "10"]
            const dataObj = new Date(partes[0], partes[1] - 1, partes[2]); // local time
            dataFormatada = dataObj.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
            });
        }

        // Adiciona o evento com a data formatada
        acc[data].push({
            ...evento,
            dataFormatada,
        });

        return acc;
    }, {});

    // Converte para array e ordena cronologicamente
    const gruposOrdenados = Object.keys(eventosPorData)
        .sort((a, b) => {
            if (a === "Sem Data") return 1; // "Sem Data" no final
            if (b === "Sem Data") return -1;
            return new Date(a) - new Date(b);
        })
        .map((data) => {
            const eventos = eventosPorData[data];
            const primeiraDataFormatada = eventos[0]?.dataFormatada || "Sem data definida";
            return {
                data,
                dataFormatada: primeiraDataFormatada,
                eventos,
            };
        });

    return gruposOrdenados;
}



module.exports = { listar, cadastrar, agruparPorTipo, agruparPorData };