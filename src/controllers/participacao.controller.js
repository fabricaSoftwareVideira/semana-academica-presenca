// src/controllers/participacao.controller.js
const AlunoRepository = require("../repositories/aluno.repository.js");
const EventoRepository = require("../repositories/evento.repository.js");
const TurmaRepository = require("../repositories/turma.repository.js");
const ValidacaoService = require('../services/validacao.service.js');
const { validarCancelamentoVitoriaChain, validarVitoriaChain, calcularPontos, obterTextoColocacao } = require('../services/vitoria.validation.js');
const { userView } = require('../utils/user-view.utils.js');
const { isAdmin } = require('../utils/auth.utils.js');
const { validarCancelamentoParticipacaoChain } = require('../services/cancelamento-participacao.validation.js');

// ---------------- PARTICIPAÇÃO INDIVIDUAL (para alunos) ----------------
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
    // Adicionar a quantidade de pontos do evento para o aluno
    alunos[idx].pontos = (alunos[idx].pontos || 0) + evento.pontos;

    AlunoRepository.saveAll(alunos);

    return { success: true, data: { aluno: alunos[idx] } };
}

function registrarParticipacaoIndividual(matricula, eventoId, user) {
    const resultadoValidacao = ValidacaoService.validarParticipacaoChain({ matricula, eventoId });

    if (!resultadoValidacao.success) return resultadoValidacao;

    const { aluno, evento } = resultadoValidacao.data;
    return adicionarParticipacao(aluno, evento, user);
}

function participarHandler(req, res) {
    const { eventoId } = req.params;
    console.log(eventoId);

    const codigo = req.alunoDecoded.codigo; // 🔑 JWT

    const aluno = AlunoRepository.findByCodigo(codigo);
    if (!aluno) {
        return res.status(400).json({ success: false, message: "Aluno não encontrado" });
    }

    const resultado = registrarParticipacaoIndividual(aluno.matricula, eventoId, req.user);

    if (!resultado.success) {
        return res.status(400).json(resultado);
    }

    res.json(resultado);
}

// ---------------- VITÓRIAS (sistema atualizado para múltiplas colocações) ----------------
function registrarVitoria(matricula, eventoId, posicao) {
    const resultadoValidacao = validarVitoriaChain({ matricula, eventoId, posicao });
    if (!resultadoValidacao.success) return resultadoValidacao;

    const { turma, evento, vitoriaConfig } = resultadoValidacao.data;
    const turmas = TurmaRepository.getAll();

    const idx = turmas.findIndex(t => t.id === turma.id);
    if (idx === -1) {
        return { success: false, message: "Turma não encontrada para salvar" };
    }

    // Usar configuração de vitória validada
    const pontos = vitoriaConfig ? vitoriaConfig.pontos : calcularPontos(evento, posicao);
    const colocacao = posicao === 'participacao' ? 'participacao' : parseInt(posicao);

    // Atualizar pontos da turma
    turmas[idx].pontos = (turmas[idx].pontos || 0) + pontos;

    // Adicionar vitória
    if (!Array.isArray(turmas[idx].vitorias)) turmas[idx].vitorias = [];

    const novaVitoria = {
        eventoId: evento.id,
        eventoNome: evento.nome,
        posicao: colocacao,
        pontos: pontos,
        data: new Date().toISOString(),
        tipoRegistro: posicao === 'participacao' ? 'participacao' : 'vitoria'
    };

    // Adicionar detalhes específicos da vitória se não for participação
    if (posicao !== 'participacao' && vitoriaConfig) {
        novaVitoria.detalhesVitoria = {
            colocacao: vitoriaConfig.colocacao,
            descricao: obterTextoColocacao(posicao)
        };
    }

    turmas[idx].vitorias.push(novaVitoria);

    TurmaRepository.saveAll(turmas);

    return {
        success: true,
        data: {
            turma: turmas[idx],
            vitoria: novaVitoria,
            pontosGanhos: pontos
        }
    };
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

    // Resposta mais informativa
    const { vitoria, pontosGanhos } = resultado.data;
    const textoColocacao = obterTextoColocacao(posicao);

    res.json({
        success: true,
        message: posicao === 'participacao'
            ? `✅ Participação registrada! Turma ganhou ${pontosGanhos} pontos.`
            : `🏆 Vitória registrada! Turma conquistou ${textoColocacao} e ganhou ${pontosGanhos} pontos!`,
        data: resultado.data
    });
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

    // Remover vitória e ajustar pontos
    turmas[idx].vitorias.splice(vitoriaIndex, 1);
    turmas[idx].pontos = Math.max(0, (turmas[idx].pontos || 0) - vitoria.pontos);

    TurmaRepository.saveAll(turmas);

    return {
        success: true,
        data: {
            turma: turmas[idx],
            vitoriaRemovida: vitoria,
            pontosSubtraidos: vitoria.pontos
        }
    };
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

    // Resposta mais informativa para cancelamento
    const { vitoriaRemovida, pontosSubtraidos } = resultado.data;
    const textoColocacao = obterTextoColocacao(posicao);

    res.json({
        success: true,
        message: posicao === 'participacao'
            ? `❌ Participação cancelada. ${pontosSubtraidos} pontos removidos.`
            : `❌ Vitória cancelada. ${textoColocacao} removida e ${pontosSubtraidos} pontos subtraídos.`,
        data: resultado.data
    });
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

// ---------------- REGISTRO DE PARTICIPAÇÃO VIA QR CODE (sistema unificado) ----------------
async function registrarParticipacao(req, res) {
    try {
        console.log('Iniciando registro de participação...');
        console.log('Dados recebidos:', {
            body: req.body,
            eventoId: req.body.eventoId,
            posicao: req.body.posicao
        });

        const { token, eventoId, posicao } = req.body;

        // Validações básicas
        if (!token || !eventoId || !posicao) {
            return res.status(400).json({
                success: false,
                message: 'Dados obrigatórios não fornecidos (token, eventoId, posicao)'
            });
        }

        // Verificar se registro está ativo
        if (process.env.REGISTRO_PARTICIPACAO_ATIVO === 'false') {
            return res.status(403).json({
                success: false,
                message: 'Registro de participação está desabilitado no momento.'
            });
        }

        // Buscar evento
        const evento = EventoRepository.findById(parseInt(eventoId));
        if (!evento) {
            return res.status(404).json({
                success: false,
                message: 'Evento não encontrado'
            });
        }

        // Decodificar token JWT e buscar aluno
        const jwtService = require('../services/jwt.service');
        const decodedToken = jwtService.verifyToken(token);

        if (!decodedToken.success) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        const aluno = AlunoRepository.findByCode(decodedToken.data.codigo);
        if (!aluno) {
            return res.status(404).json({
                success: false,
                message: 'Aluno não encontrado'
            });
        }

        // Calcular pontos baseado na posição
        let pontos = calcularPontos(evento, posicao);
        let tipoRegistro = posicao === 'participacao' ? 'participacao' : 'vitoria';
        let detalhesVitoria = null;

        if (posicao !== 'participacao') {
            const colocacao = parseInt(posicao);

            // Verificar se a colocação é válida para o evento
            if (evento.vitorias && Array.isArray(evento.vitorias)) {
                const vitoria = evento.vitorias.find(v => v.colocacao === colocacao);
                if (!vitoria) {
                    const colocacoesDisponiveis = evento.vitorias.map(v => v.colocacao).sort((a, b) => a - b);
                    return res.status(400).json({
                        success: false,
                        message: `Colocação ${colocacao} não disponível para este evento. Colocações válidas: ${colocacoesDisponiveis.join(', ')}`
                    });
                }

                pontos = vitoria.pontos;
                detalhesVitoria = {
                    colocacao: colocacao,
                    pontos: vitoria.pontos,
                    descricao: obterTextoColocacao(posicao)
                };
                console.log(`🏆 Vitória detectada: ${colocacao}º lugar (${pontos} pontos)`);
            } else if (![1, 2, 3].includes(colocacao)) {
                // Sistema legado - aceita apenas 1, 2, 3
                return res.status(400).json({
                    success: false,
                    message: 'Este evento usa o sistema legado. Colocações válidas: 1, 2, 3'
                });
            }
        }

        console.info('Registro será feito com:', {
            tipo: tipoRegistro,
            pontos: pontos,
            posicao: posicao,
            detalhesVitoria: detalhesVitoria
        });

        // Verificar se já participou (considerando tanto participação quanto vitórias)
        const jaParticipou = aluno.participacoes && aluno.participacoes.some(p => {
            // Se posições são iguais, já participou
            if (p.posicao === posicao) return true;

            // Se aluno já tem participação normal e está tentando registrar vitória (ou vice-versa)
            if ((p.posicao === 'participacao' && posicao !== 'participacao') ||
                (p.posicao !== 'participacao' && posicao === 'participacao')) {
                return p.eventoId === parseInt(eventoId);
            }

            return false;
        });

        if (jaParticipou) {
            return res.status(409).json({
                success: false,
                message: `Aluno ${aluno.nome} já está registrado neste evento`
            });
        }

        // Registrar participação
        const participacao = {
            eventoId: parseInt(eventoId),
            eventoNome: evento.nome,
            posicao: posicao,
            pontos: pontos,
            dataRegistro: new Date().toISOString(),
            tipoRegistro: tipoRegistro,
            user: req.user ? req.user.username : 'sistema'
        };

        if (detalhesVitoria) {
            participacao.vitoria = detalhesVitoria;
        }

        // Adicionar participação ao aluno
        if (!aluno.participacoes) {
            aluno.participacoes = [];
        }
        aluno.participacoes.push(participacao);

        // Atualizar pontos totais do aluno
        aluno.pontos = (aluno.pontos || 0) + pontos;

        // Salvar aluno atualizado
        AlunoRepository.update(aluno.matricula, aluno);

        console.log('Participação registrada com sucesso');

        return res.json({
            success: true,
            message: tipoRegistro === 'vitoria'
                ? `🏆 Vitória registrada! ${aluno.nome} conquistou ${obterTextoColocacao(posicao)} e ganhou ${pontos} pontos!`
                : `✅ Participação registrada! ${aluno.nome} ganhou ${pontos} pontos!`,
            data: {
                aluno: {
                    nome: aluno.nome,
                    matricula: aluno.matricula,
                    turma: aluno.turma,
                    codigo: aluno.codigo,
                    pontosTotal: aluno.pontos
                },
                evento: evento.nome,
                posicao: posicao,
                pontos: pontos,
                tipoRegistro: tipoRegistro,
                vitoria: detalhesVitoria,
                dataRegistro: participacao.dataRegistro
            }
        });

    } catch (error) {
        console.error('❌ Erro ao registrar participação:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
}

module.exports = {
    participarHandler,
    registrarVitoriaHandler,
    cancelarParticipacaoHandler,
    cancelarVitoriaHandler,
    registrarParticipacaoPage,
    registrarParticipacao
};