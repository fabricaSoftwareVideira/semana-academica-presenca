// src/services/cancelamento-participacao.validation.js
const AlunoRepository = require('../repositories/aluno.repository.js');
const EventoRepository = require('../repositories/evento.repository.js');

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
        // sempre retorna no formato padronizado
        return {
            success: true,
            data: request
        };
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

// Validação de evento
class EventoValidationHandler extends Handler {
    handle(request) {
        const { eventoId } = request;
        const evento = EventoRepository.findById(parseInt(eventoId));
        if (!evento) {
            return {
                success: false,
                message: 'Evento não encontrado',
                data: { aluno: request.aluno }
            };
        }
        request.evento = evento;
        return super.handle(request);
    }
}

// Validação de participação existente
class ParticipacaoExistenteHandler extends Handler {
    handle(request) {
        const { aluno, evento } = request;
        if (!aluno.participacoes) aluno.participacoes = [];

        const participacaoIndex = aluno.participacoes.findIndex((p) => p.id === evento.id);
        if (participacaoIndex === -1) {
            return {
                success: false,
                message: 'Aluno não participou deste evento',
                data: { aluno: request.aluno }
            };
        }

        request.participacaoIndex = participacaoIndex;
        return super.handle(request);
    }
}

function validarCancelamentoParticipacaoChain({ matricula, eventoId }) {
    const alunoHandler = new AlunoValidationHandler();
    const eventoHandler = new EventoValidationHandler();
    const participacaoExistenteHandler = new ParticipacaoExistenteHandler();

    alunoHandler.setNext(eventoHandler).setNext(participacaoExistenteHandler);

    return alunoHandler.handle({ matricula, eventoId });
}

module.exports = {
    validarCancelamentoParticipacaoChain
};
