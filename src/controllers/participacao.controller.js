const AlunoRepository = require("../repositories/aluno.repository.js");
const EventoRepository = require("../repositories/evento.repository.js");
const TurmaRepository = require("../repositories/turma.repository.js");
const ValidacaoService = require('../services/validacao.service.js');
const { validarCancelamentoVitoriaChain } = require('../services/vitoria.validation.js');
const { validarVitoriaChain } = require('../services/vitoria.validation.js');
const { userView } = require('../utils/user-view.utils.js');
const { isAdmin, isOrganizador, isConvidado } = require('../utils/auth.utils.js');

function adicionarParticipacao(aluno, evento) {
    const alunos = AlunoRepository.getAll();
    const participacao = {
        id: evento.id,
        nome: evento.nome,
        data: new Date().toISOString()
    };
    if (!aluno.participacoes) aluno.participacoes = [];
    aluno.participacoes.push(participacao);
    aluno.pontos = (aluno.pontos || 0) + 1;
    AlunoRepository.saveAll(alunos);
    return { success: true, aluno };
}

function registrarParticipacao(matricula, eventoId) {
    const resultadoValidacao = ValidacaoService.validarParticipacaoChain({ matricula, eventoId });
    if (resultadoValidacao.error) return resultadoValidacao;
    const { aluno, evento } = resultadoValidacao;
    return adicionarParticipacao(aluno, evento);
}

function participarHandler(req, res) {
    const { eventoId } = req.params;
    const matricula = req.alunoDecoded.matricula; // 🔑 do JWT

    const resultado = registrarParticipacao(matricula, eventoId);
    if (resultado.error) {
        return res.status(400).json({ error: resultado.error });
    }
    res.json(resultado);
}

function registrarVitoria(matricula, eventoId, posicao) {
    const resultadoValidacao = validarVitoriaChain({ matricula, eventoId, posicao });
    if (resultadoValidacao.error) return resultadoValidacao;
    const { turma, evento } = resultadoValidacao;
    const turmas = TurmaRepository.getAll();
    let pontos = 0;
    if (posicao === "1") pontos = evento.primeiroLugar;
    else if (posicao === "2") pontos = evento.segundoLugar;
    else if (posicao === "3") pontos = evento.terceiroLugar;
    if (turma.pontos === null || turma.pontos === undefined) turma.pontos = 0;
    turma.pontos += pontos;
    if (!turma.vitorias) turma.vitorias = [];
    turma.vitorias.push({
        eventoId: evento.id,
        eventoNome: evento.nome,
        posicao: parseInt(posicao),
        pontos,
        data: new Date().toISOString()
    });
    TurmaRepository.saveAll(turmas);
    return { success: true, turma };
}

function registrarVitoriaHandler(req, res) {
    const { eventoId, posicao } = req.params;
    const matricula = req.alunoDecoded.matricula; // 🔑 do JWT
    const resultado = registrarVitoria(matricula, eventoId, posicao);

    if (resultado.error) {
        return res.status(400).json({ error: resultado.error });
    }

    res.json(resultado.turma);
}

function cancelarParticipacao(matricula, eventoId) {
    const alunos = AlunoRepository.getAll();
    const eventos = EventoRepository.getAll();

    const { validarCancelamentoParticipacaoChain } = require('../services/cancelamento-participacao.validation.js');

    const resultadoValidacao = validarCancelamentoParticipacaoChain({ matricula, eventoId });
    if (resultadoValidacao.error) return resultadoValidacao;
    const { aluno, evento, participacaoIndex } = resultadoValidacao;
    aluno.participacoes.splice(participacaoIndex, 1);
    aluno.pontos -= 1;
    if (aluno.pontos < 0) aluno.pontos = 0;
    AlunoRepository.saveAll(alunos);
    return { success: true, aluno };
}

function cancelarVitoria(matricula, eventoId, posicao) {
    const resultadoValidacao = validarCancelamentoVitoriaChain({ matricula, eventoId, posicao });
    if (resultadoValidacao.error) return resultadoValidacao;
    const { turma, vitoriaIndex, vitoria } = resultadoValidacao;
    const turmas = TurmaRepository.getAll();
    turma.vitorias.splice(vitoriaIndex, 1);
    turma.pontos -= vitoria.pontos;
    if (turma.pontos < 0) turma.pontos = 0;
    TurmaRepository.saveAll(turmas);
    return { success: true, turma };
}

function cancelarParticipacaoHandler(req, res) {
    const { eventoId } = req.params;
    const matricula = req.alunoDecoded.matricula; // 🔑 do JWT
    const aluno = AlunoRepository.findByMatricula(matricula);
    if (!aluno) {
        return res.status(400).json({ error: "Aluno não encontrado" });
    }
    const resultado = cancelarParticipacao(matricula, eventoId);
    if (resultado && resultado.error) {
        return res.status(400).json({ error: resultado.error });
    }
    return res.json(resultado);
}

function cancelarVitoriaHandler(req, res) {
    const { eventoId, posicao } = req.params;
    const matricula = req.alunoDecoded.matricula; // 🔑 do JWT
    const resultado = cancelarVitoria(matricula, eventoId, posicao);


    if (resultado.error) {
        return res.status(400).json({ error: resultado.error });
    }

    res.json(resultado.turma);
}

function registrarParticipacaoPage(req, res) {
    const alunos = AlunoRepository.getAll();
    const todosEventos = EventoRepository.getAll();
    let eventos;
    if (isAdmin(req.user)) {
        eventos = todosEventos;
    } else {
        eventos = todosEventos.filter((e) => Array.isArray(e.users) && e.users.includes(req.user.username));
    }

    if (!Array.isArray(eventos) || eventos.length === 0) {
        return res.render("registrar-participacao", {
            user: userView(req.user),
            error: true,
            message: "Nenhum evento disponível para registro.",
            alunos: [],
            eventos: []
        });
    }

    res.render("registrar-participacao", { user: userView(req.user), alunos, eventos });
}

module.exports = { participarHandler, registrarVitoriaHandler, cancelarParticipacaoHandler, cancelarVitoriaHandler, registrarParticipacaoPage };