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

// Validação de posição
class PosicaoValidationHandler extends Handler {
    handle(request) {
        const { posicao } = request;
        if (!['1', '2', '3'].includes(posicao)) {
            return { success: false, message: 'Posição inválida. Use 1, 2 ou 3.' };
        }
        return super.handle(request);
    }
}

// Validação de pontos definidos no evento
class PontosEventoValidationHandler extends Handler {
    handle(request) {
        const { evento } = request;
        if (!evento.primeiroLugar || !evento.segundoLugar || !evento.terceiroLugar) {
            return { success: false, message: 'Evento não tem pontos definidos para posições' };
        }
        return super.handle(request);
    }
}

// Validação de duplicidade de vitória para turma
class DuplicidadeTurmaVitoriaHandler extends Handler {
    handle(request) {
        const { turma, evento, posicao } = request;
        if (!turma.vitorias) turma.vitorias = [];
        if (turma.vitorias.find((v) => v.eventoId === evento.id && v.posicao === parseInt(posicao))) {
            return { success: false, message: 'Turma já registrou vitória nesta posição para este evento' };
        }
        if (turma.vitorias.find((v) => v.eventoId === evento.id)) {
            const posicaoVitoria = turma.vitorias.find((v) => v.eventoId === evento.id).posicao;
            const posicaoTexto = posicaoVitoria === 1 ? '1º lugar' : posicaoVitoria === 2 ? '2º lugar' : '3º lugar';
            return { success: false, message: `Turma já registrou vitória para este evento na posição ${posicaoTexto}` };
        }
        return super.handle(request);
    }
}

// Validação de duplicidade global de vitória
class DuplicidadeGlobalVitoriaHandler extends Handler {
    handle(request) {
        const { turmas, evento, posicao } = request;
        const todasVitorias = turmas.flatMap((t) => t.vitorias || []);
        if (todasVitorias.find((v) => v.eventoId === evento.id && v.posicao === parseInt(posicao))) {
            const turma = turmas.find((t) => t.vitorias && t.vitorias.find((v) => v.eventoId === evento.id && v.posicao === parseInt(posicao)));
            return { success: false, message: `Vitória para posição ${posicao} já registrada na turma ${turma.id}` };
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

// Handlers para cancelamento de vitória
class VitoriaExistenteHandler extends Handler {
    handle(request) {
        const { turma, evento, posicao } = request;
        if (!turma.vitorias) turma.vitorias = [];
        const vitoriaIndex = turma.vitorias.findIndex((v) => v.eventoId === evento.id && v.posicao === parseInt(posicao));
        if (vitoriaIndex === -1) {
            return { success: false, message: 'Turma não registrou vitória nesta posição para este evento' };
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

module.exports = {
    validarVitoriaChain,
    validarCancelamentoVitoriaChain
};