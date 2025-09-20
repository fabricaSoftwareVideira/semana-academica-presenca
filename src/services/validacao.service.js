const AlunoRepository = require('../repositories/aluno.repository.js');
const EventoRepository = require('../repositories/evento.repository.js');

// Handler base
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

// Validação de participação
class ParticipacaoValidationHandler extends Handler {
    handle(request) {
        const { aluno, evento } = request;

        if (!aluno || !evento) {
            return { success: false, message: 'Aluno e evento devem estar carregados antes da validação de participação' };
        }

        if (aluno.participacoes?.some(p => p.id === evento.id)) {
            return { success: false, message: 'Participação já registrada', data: { aluno } };
        }

        return super.handle(request);
    }
}

// Função para executar a chain
function validarParticipacaoChain({ matricula, eventoId }) {
    const alunoHandler = new AlunoValidationHandler();
    const eventoHandler = new EventoValidationHandler();
    const participacaoHandler = new ParticipacaoValidationHandler();

    alunoHandler.setNext(eventoHandler).setNext(participacaoHandler);

    return alunoHandler.handle({ matricula, eventoId });
}

module.exports = {
    validarParticipacaoChain
};
