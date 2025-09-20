// src/controllers/participacao.controller.js
const AlunoRepository = require("../repositories/aluno.repository.js");
const EventoRepository = require("../repositories/evento.repository.js");
const TurmaRepository = require("../repositories/turma.repository.js");
const ValidacaoService = require('../services/validacao.service.js');
const { validarCancelamentoVitoriaChain, validarVitoriaChain } = require('../services/vitoria.validation.js');
const { userView } = require('../utils/user-view.utils.js');
const { isAdmin } = require('../utils/auth.utils.js');
const { validarCancelamentoParticipacaoChain } = require('../services/cancelamento-participacao.validation.js');

// ---------------- PARTICIPAÇÃO ----------------
function adicionarParticipacao(aluno, evento, user) {
    const alunos = AlunoRepository.getAll();

    const participacao = {
        id: evento.id,
        nome: evento.nome,
        data: new Date().toISOString(),
        user: user.username
    };

    const idx = alunos.findIndex(a => a.matricula === aluno.matricula);
    if (idx === -1) {
        return { success: false, message: "Aluno não encontrado para salvar" };
    }

    if (!Array.isArray(alunos[idx].participacoes)) {
        alunos[idx].participacoes = [];
    }

    alunos[idx].participacoes.push(participacao);
    alunos[idx].pontos = (alunos[idx].pontos || 0) + 1;

    AlunoRepository.saveAll(alunos);

    return { success: true, data: { aluno: alunos[idx] } };
}

function registrarParticipacao(matricula, eventoId, user) {
    const resultadoValidacao = ValidacaoService.validarParticipacaoChain({ matricula, eventoId });

    if (!resultadoValidacao.success) return resultadoValidacao;

    const { aluno, evento } = resultadoValidacao.data;
    return adicionarParticipacao(aluno, evento, user);
}

function participarHandler(req, res) {
    const { eventoId } = req.params;
    const codigo = req.alunoDecoded.codigo; // 🔑 JWT

    const aluno = AlunoRepository.findByCodigo(codigo);
    if (!aluno) {
        return res.status(400).json({ success: false, message: "Aluno não encontrado" });
    }

    const resultado = registrarParticipacao(aluno.matricula, eventoId, req.user);

    if (!resultado.success) {
        return res.status(400).json(resultado);
    }

    res.json(resultado);
}

// ---------------- VITÓRIAS ----------------
function registrarVitoria(matricula, eventoId, posicao) {
    const resultadoValidacao = validarVitoriaChain({ matricula, eventoId, posicao });
    if (!resultadoValidacao.success) return resultadoValidacao;

    const { turma, evento } = resultadoValidacao.data;
    const turmas = TurmaRepository.getAll();

    const idx = turmas.findIndex(t => t.id === turma.id);
    if (idx === -1) {
        return { success: false, message: "Turma não encontrada para salvar" };
    }

    let pontos = 0;
    if (posicao === "1") pontos = evento.primeiroLugar;
    else if (posicao === "2") pontos = evento.segundoLugar;
    else if (posicao === "3") pontos = evento.terceiroLugar;

    turmas[idx].pontos = (turmas[idx].pontos || 0) + pontos;

    if (!Array.isArray(turmas[idx].vitorias)) turmas[idx].vitorias = [];
    turmas[idx].vitorias.push({
        eventoId: evento.id,
        eventoNome: evento.nome,
        posicao: parseInt(posicao),
        pontos,
        data: new Date().toISOString()
    });

    TurmaRepository.saveAll(turmas);

    return { success: true, data: { turma: turmas[idx] } };
}

function registrarVitoriaHandler(req, res) {
    const { eventoId, posicao } = req.params;
    const codigo = req.alunoDecoded.codigo;

    const aluno = AlunoRepository.findByCodigo(codigo);
    if (!aluno) {
        return res.status(400).json({ success: false, message: "Aluno não encontrado" });
    }

    const resultado = registrarVitoria(aluno.matricula, eventoId, posicao);

    if (!resultado.success) {
        return res.status(400).json(resultado);
    }

    res.json(resultado);
}

// ---------------- CANCELAMENTOS ----------------
function cancelarParticipacao(matricula, eventoId) {
    const alunos = AlunoRepository.getAll();

    const resultadoValidacao = validarCancelamentoParticipacaoChain({ matricula, eventoId });

    if (!resultadoValidacao.success) return resultadoValidacao;

    const { aluno, participacaoIndex } = resultadoValidacao.data;

    const idx = alunos.findIndex(a => a.matricula === aluno.matricula);
    if (idx === -1) {
        return { success: false, message: "Aluno não encontrado ao salvar" };
    }

    alunos[idx].participacoes.splice(participacaoIndex, 1);
    alunos[idx].pontos = Math.max(0, (alunos[idx].pontos || 0) - 1);

    AlunoRepository.saveAll(alunos);

    return { success: true, data: { aluno: alunos[idx] } };
}

function cancelarVitoria(matricula, eventoId, posicao) {
    const resultadoValidacao = validarCancelamentoVitoriaChain({ matricula, eventoId, posicao });
    if (!resultadoValidacao.success) return resultadoValidacao;

    const { turma, vitoriaIndex, vitoria } = resultadoValidacao.data;
    const turmas = TurmaRepository.getAll();

    const idx = turmas.findIndex(t => t.id === turma.id);
    if (idx === -1) {
        return { success: false, message: "Turma não encontrada para salvar" };
    }

    turmas[idx].vitorias.splice(vitoriaIndex, 1);
    turmas[idx].pontos = Math.max(0, (turmas[idx].pontos || 0) - vitoria.pontos);

    TurmaRepository.saveAll(turmas);

    return { success: true, data: { turma: turmas[idx] } };
}

function cancelarParticipacaoHandler(req, res) {
    const { eventoId } = req.params;
    const codigo = req.alunoDecoded.codigo;

    const aluno = AlunoRepository.findByCodigo(codigo);
    if (!aluno) {
        return res.status(400).json({ success: false, message: "Aluno não encontrado" });
    }

    const resultado = cancelarParticipacao(aluno.matricula, eventoId);

    if (!resultado.success) {
        return res.status(400).json(resultado);
    }

    res.json(resultado);
}

function cancelarVitoriaHandler(req, res) {
    const { eventoId, posicao } = req.params;
    const codigo = req.alunoDecoded.codigo;

    const aluno = AlunoRepository.findByCodigo(codigo);
    if (!aluno) {
        return res.status(400).json({ success: false, message: "Aluno não encontrado" });
    }

    const resultado = cancelarVitoria(aluno.matricula, eventoId, posicao);

    if (!resultado.success) {
        return res.status(400).json(resultado);
    }

    res.json(resultado);
}

// ---------------- PAGE ----------------
function registrarParticipacaoPage(req, res) {
    if (process.env.REGISTRO_PARTICIPACAO_ATIVO === 'false') {
        return res.render("registrar-participacao", {
            user: userView(req.user),
            error: true,
            message: "Registro de participação está desabilitado no momento.",
            alunos: [],
            eventos: []
        });
    }

    const alunos = AlunoRepository.getAll();
    const todosEventos = EventoRepository.getAll();

    const eventos = isAdmin(req.user)
        ? todosEventos
        : todosEventos.filter(e => Array.isArray(e.users) && e.users.includes(req.user.username));

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

module.exports = {
    participarHandler,
    registrarVitoriaHandler,
    cancelarParticipacaoHandler,
    cancelarVitoriaHandler,
    registrarParticipacaoPage
};