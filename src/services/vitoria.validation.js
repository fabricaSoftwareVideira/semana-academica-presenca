const AlunoRepository = require('../repositories/aluno.repository.js');
const EventoRepository = require('../repositories/evento.repository.js');
const TurmaRepository = require('../repositories/turma.repository.js');

// Handler base para Chain of Responsibility
class Handler {
    setNext(handler) {
        this.next = handler;
        return handler;
    }
    handle(request) {
        if (this.next) {
            return this.next.handle(request);
        }
        return { success: true, data: request };
    }
}

// Validação de aluno
class AlunoValidationHandler extends Handler {
    handle(request) {
        const { matricula } = request;
        const aluno = AlunoRepository.findByMatricula(matricula);
        if (!aluno) {
            return { success: false, message: 'Aluno não encontrado' };
        }
        request.aluno = aluno;
        return super.handle(request);
    }
}

// Validação de turma
class TurmaValidationHandler extends Handler {
    handle(request) {
        const { aluno } = request;
        const turma = TurmaRepository.findById(aluno.turma);
        if (!turma) {
            return { success: false, message: 'Turma não encontrada' };
        }
        request.turma = turma;
        return super.handle(request);
    }
}

// Validação de evento
class EventoValidationHandler extends Handler {
    handle(request) {
        const { eventoId } = request;
        const evento = EventoRepository.findById(parseInt(eventoId));
        if (!evento) {
            return { success: false, message: 'Evento não encontrado' };
        }
        request.evento = evento;
        return super.handle(request);
    }
}

// Validação de posição (atualizada para suportar múltiplas colocações)
class PosicaoValidationHandler extends Handler {
    handle(request) {
        const { posicao, evento } = request;

        // Se for participação normal, é válida
        if (posicao === 'participacao') {
            return super.handle(request);
        }

        // Converter posição para número
        const colocacao = parseInt(posicao);

        // Validar se é um número válido
        if (isNaN(colocacao) || colocacao < 1) {
            return { success: false, message: 'Posição inválida. Use números a partir de 1 ou "participacao".' };
        }

        // Se evento tem array de vitórias, validar contra ele
        if (evento && evento.vitorias && Array.isArray(evento.vitorias)) {
            const vitoriaValida = evento.vitorias.find(v => v.colocacao === colocacao);
            if (!vitoriaValida) {
                const colocacoesDisponiveis = evento.vitorias.map(v => v.colocacao).sort((a, b) => a - b);
                return {
                    success: false,
                    message: `Posição ${colocacao} não disponível para este evento. Colocações válidas: ${colocacoesDisponiveis.join(', ')}`
                };
            }
        } else {
            // Sistema legado - aceita apenas 1, 2, 3
            if (![1, 2, 3].includes(colocacao)) {
                return { success: false, message: 'Posição inválida. Use 1, 2 ou 3 para eventos sem configuração de vitórias.' };
            }
        }

        return super.handle(request);
    }
}

// Validação de pontos definidos no evento (atualizada)
class PontosEventoValidationHandler extends Handler {
    handle(request) {
        const { evento, posicao } = request;

        // Se for participação, não precisa validar vitórias
        if (posicao === 'participacao') {
            return super.handle(request);
        }

        const colocacao = parseInt(posicao);

        // Sistema novo - verificar array de vitórias
        if (evento.vitorias && Array.isArray(evento.vitorias)) {
            const vitoria = evento.vitorias.find(v => v.colocacao === colocacao);
            if (!vitoria || !vitoria.pontos || vitoria.pontos <= 0) {
                return {
                    success: false,
                    message: `Evento não tem pontos definidos para a ${colocacao}ª colocação`
                };
            }

            // Armazenar dados da vitória para uso posterior
            request.vitoriaConfig = vitoria;
            return super.handle(request);
        }

        // Sistema legado - verificar propriedades antigas
        const camposLegado = {
            1: 'primeiroLugar',
            2: 'segundoLugar',
            3: 'terceiroLugar'
        };

        const campo = camposLegado[colocacao];
        if (!campo || !evento[campo] || evento[campo] <= 0) {
            return {
                success: false,
                message: `Evento não tem pontos definidos para a ${colocacao}ª colocação (sistema legado)`
            };
        }

        // Criar config de vitória compatível para sistema legado
        request.vitoriaConfig = {
            colocacao: colocacao,
            pontos: evento[campo]
        };

        return super.handle(request);
    }
}

// Validação de duplicidade de vitória para turma (atualizada)
class DuplicidadeTurmaVitoriaHandler extends Handler {
    handle(request) {
        const { turma, evento, posicao } = request;

        // Se for participação, não validar duplicidade de vitória
        if (posicao === 'participacao') {
            return super.handle(request);
        }

        const colocacao = parseInt(posicao);

        if (!turma.vitorias) turma.vitorias = [];

        // Verificar se turma já registrou vitória nesta colocação específica
        if (turma.vitorias.find((v) => v.eventoId === evento.id && v.posicao === colocacao)) {
            return {
                success: false,
                message: `Turma já registrou vitória na ${colocacao}ª colocação para este evento`
            };
        }

        // Para eventos com múltiplas colocações, uma turma pode ter várias vitórias no mesmo evento
        // Mas vamos verificar se não está duplicando a mesma colocação
        const vitoriaExistente = turma.vitorias.find((v) => v.eventoId === evento.id && v.posicao === colocacao);
        if (vitoriaExistente) {
            return {
                success: false,
                message: `Turma já registrou vitória na ${colocacao}ª colocação para este evento`
            };
        }

        return super.handle(request);
    }
}

// Validação de duplicidade global de vitória (atualizada)
class DuplicidadeGlobalVitoriaHandler extends Handler {
    handle(request) {
        const { turmas, evento, posicao } = request;

        // Se for participação, não validar duplicidade global
        if (posicao === 'participacao') {
            return super.handle(request);
        }

        const colocacao = parseInt(posicao);

        const todasVitorias = turmas.flatMap((t) => t.vitorias || []);

        // Verificar se já existe vitória nesta colocação específica para este evento
        const vitoriaExistente = todasVitorias.find((v) => v.eventoId === evento.id && v.posicao === colocacao);

        if (vitoriaExistente) {
            const turma = turmas.find((t) =>
                t.vitorias && t.vitorias.find((v) => v.eventoId === evento.id && v.posicao === colocacao)
            );
            return {
                success: false,
                message: `Vitória na ${colocacao}ª colocação já registrada para a turma ${turma.id}`
            };
        }

        return super.handle(request);
    }
}

function validarVitoriaChain({ matricula, eventoId, posicao }) {
    const turmas = TurmaRepository.getAll();
    const alunoHandler = new AlunoValidationHandler();
    const turmaHandler = new TurmaValidationHandler();
    const eventoHandler = new EventoValidationHandler();
    const posicaoHandler = new PosicaoValidationHandler();
    const pontosEventoHandler = new PontosEventoValidationHandler();
    const duplicidadeTurmaHandler = new DuplicidadeTurmaVitoriaHandler();
    const duplicidadeGlobalHandler = new DuplicidadeGlobalVitoriaHandler();

    alunoHandler
        .setNext(turmaHandler)
        .setNext(eventoHandler)
        .setNext(posicaoHandler)
        .setNext(pontosEventoHandler)
        .setNext(duplicidadeTurmaHandler)
        .setNext(duplicidadeGlobalHandler);

    return alunoHandler.handle({ matricula, eventoId, posicao, turmas });
}

// Handlers para cancelamento de vitória (atualizado)
class VitoriaExistenteHandler extends Handler {
    handle(request) {
        const { turma, evento, posicao } = request;

        if (!turma.vitorias) turma.vitorias = [];

        const colocacao = posicao === 'participacao' ? 'participacao' : parseInt(posicao);

        let vitoriaIndex;
        if (posicao === 'participacao') {
            // Para participação, buscar por participação normal (sem vitória)
            vitoriaIndex = turma.vitorias.findIndex((v) =>
                v.eventoId === evento.id &&
                (!v.posicao || v.posicao === 'participacao')
            );
        } else {
            // Para vitórias, buscar por colocação específica
            vitoriaIndex = turma.vitorias.findIndex((v) =>
                v.eventoId === evento.id && v.posicao === colocacao
            );
        }

        if (vitoriaIndex === -1) {
            const tipoRegistro = posicao === 'participacao' ? 'participação' : `vitória na ${colocacao}ª colocação`;
            return {
                success: false,
                message: `Turma não registrou ${tipoRegistro} para este evento`
            };
        }

        request.vitoriaIndex = vitoriaIndex;
        request.vitoria = turma.vitorias[vitoriaIndex];
        return super.handle(request);
    }
}

function validarCancelamentoVitoriaChain({ matricula, eventoId, posicao }) {
    const alunoHandler = new AlunoValidationHandler();
    const turmaHandler = new TurmaValidationHandler();
    const eventoHandler = new EventoValidationHandler();
    const vitoriaExistenteHandler = new VitoriaExistenteHandler();

    alunoHandler
        .setNext(turmaHandler)
        .setNext(eventoHandler)
        .setNext(vitoriaExistenteHandler);

    return alunoHandler.handle({ matricula, eventoId, posicao });
}

// Função auxiliar para obter texto descritivo da posição
function obterTextoColocacao(posicao) {
    if (posicao === 'participacao') {
        return 'participação';
    }

    const colocacao = parseInt(posicao);
    const sufixos = {
        1: 'º',
        2: 'º',
        3: 'º',
        4: 'º',
        5: 'º',
        6: 'º'
    };

    return `${colocacao}${sufixos[colocacao] || 'ª'} lugar`;
}

// Função auxiliar para calcular pontos baseado na configuração do evento
function calcularPontos(evento, posicao) {
    if (posicao === 'participacao') {
        return evento.pontos || 1;
    }

    const colocacao = parseInt(posicao);

    // Sistema novo - array de vitórias
    if (evento.vitorias && Array.isArray(evento.vitorias)) {
        const vitoria = evento.vitorias.find(v => v.colocacao === colocacao);
        return vitoria ? vitoria.pontos : (evento.pontos || 1);
    }

    // Sistema legado
    const camposLegado = {
        1: 'primeiroLugar',
        2: 'segundoLugar',
        3: 'terceiroLugar'
    };

    const campo = camposLegado[colocacao];
    return (campo && evento[campo]) ? evento[campo] : (evento.pontos || 1);
}

module.exports = {
    validarVitoriaChain,
    validarCancelamentoVitoriaChain,
    obterTextoColocacao,
    calcularPontos
};