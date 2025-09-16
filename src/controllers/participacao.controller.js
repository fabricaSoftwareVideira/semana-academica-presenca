const AlunoRepository = require("../repositories/aluno.repository.js");
const EventoRepository = require("../repositories/evento.repository.js");
const TurmaRepository = require("../repositories/turma.repository.js");



// Validações centralizadas em service
const ValidacaoService = require('../services/validacao.service.js');

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

// Serviço de domínio para registrar participação
function registrarParticipacao(matricula, eventoId) {
    const { aluno, error: erroAluno } = ValidacaoService.validarAluno(matricula);
    if (erroAluno) return { error: erroAluno };

    const { evento, error: erroEvento } = ValidacaoService.validarEvento(eventoId);
    if (erroEvento) return { error: erroEvento };

    const { error: erroParticipacao } = ValidacaoService.validarParticipacao(aluno, evento);
    if (erroParticipacao) return { error: erroParticipacao, aluno };

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


function validarPosicao(posicao) {
    return ["1", "2", "3"].includes(posicao);
}

// Registrar vitória para a turma em um evento com base nisso


function registrarVitoria(matricula, eventoId, posicao) {
    const turmas = TurmaRepository.getAll();
    const eventos = EventoRepository.getAll();
    const alunos = AlunoRepository.getAll();


    const aluno = AlunoRepository.findByMatricula(matricula);
    if (!aluno) {
        return { error: "Aluno não encontrado" };
    }

    const turmaId = aluno.turma;
    const turma = TurmaRepository.findById(turmaId);
    if (!turma) {
        return { error: "Turma não encontrada" };
    }

    const evento = EventoRepository.findById(parseInt(eventoId));
    if (!evento) {
        return { error: "Evento não encontrado" };
    }

    if (!validarPosicao(posicao)) {
        return { error: "Posição inválida. Use 1, 2 ou 3." };
    }

    if (!evento.primeiroLugar || !evento.segundoLugar || !evento.terceiroLugar) {
        return { error: "Evento não tem pontos definidos para posições" };
    }

    if (!turma.vitorias) turma.vitorias = [];
    if (turma.vitorias.find((v) => v.eventoId === evento.id && v.posicao === parseInt(posicao))) {
        return { error: "Turma já registrou vitória nesta posição para este evento" };
    }

    // Verifica se qualquer turma já registrou vitória para este evento na mesma posição
    const todasVitorias = turmas.flatMap((t) => t.vitorias || []);
    if (todasVitorias.find((v) => v.eventoId === evento.id && v.posicao === parseInt(posicao))) {
        const turma = turmas.find((t) => t.vitorias && t.vitorias.find((v) => v.eventoId === evento.id && v.posicao === parseInt(posicao)));
        return { error: `Vitória para posição ${posicao} já registrada na turma ${turma.id}` };
    }

    if (turma.vitorias.find((v) => v.eventoId === evento.id)) {
        const posicaoVitoria = turma.vitorias.find((v) => v.eventoId === evento.id).posicao;
        const posicaoTexto = posicaoVitoria === 1 ? "1º lugar" : posicaoVitoria === 2 ? "2º lugar" : "3º lugar";
        return { error: `Turma já registrou vitória para este evento na posição ${posicaoTexto}` };
    }

    let pontos = 0;
    if (posicao === "1") pontos = evento.primeiroLugar;
    else if (posicao === "2") pontos = evento.segundoLugar;
    else if (posicao === "3") pontos = evento.terceiroLugar;

    if (turma.pontos === null || turma.pontos === undefined) turma.pontos = 0;
    turma.pontos += pontos;

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

    const aluno = AlunoRepository.findByMatricula(matricula);
    if (!aluno) {
        return { error: "Aluno não encontrado" };
    }

    const evento = EventoRepository.findById(parseInt(eventoId));
    if (!evento) {
        return { error: "Evento não encontrado", aluno };
    }

    if (!aluno.participacoes) aluno.participacoes = [];
    const participacaoIndex = aluno.participacoes.findIndex((p) => p.id === evento.id);
    if (participacaoIndex === -1) {
        return { error: "Aluno não participou deste evento", aluno };
    }

    aluno.participacoes.splice(participacaoIndex, 1);
    aluno.pontos -= 1;
    if (aluno.pontos < 0) aluno.pontos = 0;

    AlunoRepository.saveAll(alunos);
    return { success: true, aluno };
}



function cancelarVitoria(matricula, eventoId, posicao) {
    const turmas = TurmaRepository.getAll();
    const eventos = EventoRepository.getAll();
    const alunos = AlunoRepository.getAll();


    const aluno = AlunoRepository.findByMatricula(matricula);
    if (!aluno) {
        return { error: "Aluno não encontrado" };
    }

    const turmaId = aluno.turma;
    const turma = TurmaRepository.findById(turmaId);
    if (!turma) {
        return { error: "Turma não encontrada" };
    }

    const evento = EventoRepository.findById(parseInt(eventoId));
    if (!evento) {
        return { error: "Evento não encontrado" };
    }

    if (!turma.vitorias) turma.vitorias = [];
    const vitoriaIndex = turma.vitorias.findIndex((v) => v.eventoId === evento.id && v.posicao === parseInt(posicao));
    if (vitoriaIndex === -1) {
        return { error: "Turma não registrou vitória nesta posição para este evento" };
    }

    const vitoria = turma.vitorias[vitoriaIndex];
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
    let eventos = EventoRepository.getAll();
    // Filtrar eventos que são relacionados ao usuário logado ou todos se for admin
    if (req.user.role !== "admin") {
        eventos = eventos.filter((e) => e.users && e.users.includes(req.user.username));
    }

    // Verificar se há eventos na lista. Se não houver, renderizar a página mas não permitir registro.
    if (eventos.length === 0) {
        return res.render("registrar-participacao", { user: req.user, error: true, message: "Nenhum evento disponível para registro.", alunos: [], eventos: [] });
    }

    res.render("registrar-participacao", { user: req.user, alunos, eventos });
}

module.exports = { participarHandler, registrarVitoriaHandler, cancelarParticipacaoHandler, cancelarVitoriaHandler, registrarParticipacaoPage };