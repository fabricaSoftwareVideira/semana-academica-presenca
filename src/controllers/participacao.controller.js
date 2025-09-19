const AlunoRepository = require("../repositories/aluno.repository.js");
const EventoRepository = require("../repositories/evento.repository.js");
const TurmaRepository = require("../repositories/turma.repository.js");
const ValidacaoService = require('../services/validacao.service.js');
const { validarCancelamentoVitoriaChain } = require('../services/vitoria.validation.js');
const { validarVitoriaChain } = require('../services/vitoria.validation.js');
const { userView } = require('../utils/user-view.utils.js');
const { isAdmin, isOrganizador, isConvidado } = require('../utils/auth.utils.js');
const { validarCancelamentoParticipacaoChain } = require('../services/cancelamento-participacao.validation.js');

function adicionarParticipacao(aluno, evento, user) {
    const alunos = AlunoRepository.getAll();

    const participacao = {
        id: evento.id,
        nome: evento.nome,
        data: new Date().toISOString(),
        user: user.username
    };

    // encontrar o índice correto do aluno no array
    const idx = alunos.findIndex(a => a.matricula === aluno.matricula);
    if (idx === -1) return { error: "Aluno não encontrado para salvar" };

    if (!alunos[idx].participacoes) alunos[idx].participacoes = [];
    alunos[idx].participacoes.push(participacao);
    alunos[idx].pontos = (alunos[idx].pontos || 0) + 1;

    // Atualizar o aluno no repositório
    AlunoRepository.saveAll(alunos);

    return { success: true, aluno: alunos[idx] };
}

function registrarParticipacao(matricula, eventoId, user) {
    const resultadoValidacao = ValidacaoService.validarParticipacaoChain({ matricula, eventoId });
    if (resultadoValidacao.error) return resultadoValidacao;
    const { aluno, evento } = resultadoValidacao;
    return adicionarParticipacao(aluno, evento, user);
}

function participarHandler(req, res) {
    const { eventoId } = req.params;
    const codigo = req.alunoDecoded.codigo; // 🔑 do JWT
    const aluno = AlunoRepository.findByCodigo(codigo);
    if (!aluno) {
        return res.status(400).json({ error: "Aluno não encontrado" });
    }
    const resultado = registrarParticipacao(aluno.matricula, eventoId, req.user);
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

    // ✅ localizar a turma dentro do array real
    const idx = turmas.findIndex(t => t.id === turma.id);
    if (idx === -1) return { error: "Turma não encontrada para salvar" };

    let pontos = 0;
    if (posicao === "1") pontos = evento.primeiroLugar;
    else if (posicao === "2") pontos = evento.segundoLugar;
    else if (posicao === "3") pontos = evento.terceiroLugar;

    if (turmas[idx].pontos === null || turmas[idx].pontos === undefined) {
        turmas[idx].pontos = 0;
    }
    turmas[idx].pontos += pontos;

    if (!Array.isArray(turmas[idx].vitorias)) turmas[idx].vitorias = [];
    turmas[idx].vitorias.push({
        eventoId: evento.id,
        eventoNome: evento.nome,
        posicao: parseInt(posicao),
        pontos,
        data: new Date().toISOString()
    });

    TurmaRepository.saveAll(turmas);

    return { success: true, turma: turmas[idx] };
}

function registrarVitoriaHandler(req, res) {
    const { eventoId, posicao } = req.params;
    const codigo = req.alunoDecoded.codigo; // 🔑 do JWT
    const aluno = AlunoRepository.findByCodigo(codigo);
    if (!aluno) {
        return res.status(400).json({ error: "Aluno não encontrado" });
    }
    const resultado = registrarVitoria(aluno.matricula, eventoId, posicao);
    if (resultado.error) {
        return res.status(400).json({ error: resultado.error });
    }
    res.json(resultado.turma);
}

function cancelarParticipacao(matricula, eventoId) {
    const alunos = AlunoRepository.getAll();
    const { validarCancelamentoParticipacaoChain } = require('../services/cancelamento-participacao.validation.js');

    const resultadoValidacao = validarCancelamentoParticipacaoChain({ matricula, eventoId });
    if (resultadoValidacao.error) return resultadoValidacao;

    const { aluno, evento, participacaoIndex } = resultadoValidacao;

    // localizar o aluno na lista 'alunos' para atualizar a referência correta
    const idx = alunos.findIndex(a => a.matricula === aluno.matricula);
    if (idx === -1) return { error: "Aluno não encontrado ao salvar" };

    if (!Array.isArray(alunos[idx].participacoes)) {
        return { error: "Aluno não possui participações registradas." };
    }
    if (participacaoIndex < 0 || participacaoIndex >= alunos[idx].participacoes.length) {
        return { error: "Participação não encontrada para cancelamento." };
    }

    alunos[idx].participacoes.splice(participacaoIndex, 1);
    alunos[idx].pontos = Math.max(0, (alunos[idx].pontos || 0) - 1);

    AlunoRepository.saveAll(alunos);

    return { success: true, aluno: alunos[idx] };
}


function cancelarVitoria(matricula, eventoId, posicao) {
    const resultadoValidacao = validarCancelamentoVitoriaChain({ matricula, eventoId, posicao });
    if (resultadoValidacao.error) return resultadoValidacao;

    const { turma, vitoriaIndex, vitoria } = resultadoValidacao;
    const turmas = TurmaRepository.getAll();

    const idx = turmas.findIndex(t => t.id === turma.id);
    if (idx === -1) return { error: "Turma não encontrada para salvar" };

    if (!Array.isArray(turmas[idx].vitorias)) {
        return { error: "Turma não possui vitórias registradas." };
    }
    if (vitoriaIndex < 0 || vitoriaIndex >= turmas[idx].vitorias.length) {
        return { error: "Vitória não encontrada para cancelamento." };
    }

    turmas[idx].vitorias.splice(vitoriaIndex, 1);
    turmas[idx].pontos = Math.max(0, (turmas[idx].pontos || 0) - vitoria.pontos);

    TurmaRepository.saveAll(turmas);

    return { success: true, turma: turmas[idx] };
}


function cancelarParticipacaoHandler(req, res) {
    const { eventoId } = req.params;
    const codigo = req.alunoDecoded.codigo; // 🔑 do JWT
    const aluno = AlunoRepository.findByCodigo(codigo);
    if (!aluno) {
        return res.status(400).json({ error: "Aluno não encontrado" });
    }
    const resultado = cancelarParticipacao(aluno.matricula, eventoId);
    if (resultado && resultado.error) {
        return res.status(400).json({ error: resultado.error });
    }
    return res.json(resultado);
}

function cancelarVitoriaHandler(req, res) {
    const { eventoId, posicao } = req.params;
    const codigo = req.alunoDecoded.codigo; // 🔑 do JWT
    const aluno = AlunoRepository.findByCodigo(codigo);
    if (!aluno) {
        return res.status(400).json({ error: "Aluno não encontrado" });
    }
    const resultado = cancelarVitoria(aluno.matricula, eventoId, posicao);
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