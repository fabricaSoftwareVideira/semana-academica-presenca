
const AlunoRepository = require('../repositories/aluno.repository.js');
const EventoRepository = require('../repositories/evento.repository.js');

// Handler base para Chain of Responsibility
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
        // no final da cadeia, devolve o request completo
        return request;
    }
}


// Validação de aluno
class AlunoValidationHandler extends Handler {
    handle(request) {
        const { matricula } = request;
        const aluno = AlunoRepository.findByMatricula(matricula);
        if (!aluno) {
            return { error: 'Aluno não encontrado' };
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
            return { error: 'Evento não encontrado' };
        }
        request.evento = evento;
        return super.handle(request);
    }
}

// Validação de participação
class ParticipacaoValidationHandler extends Handler {
    handle(request) {
        const { aluno, evento } = request;
        if (aluno.participacoes && aluno.participacoes.find((p) => p.id === evento.id)) {
            return { error: 'Participação já registrada', aluno };
        }
        return super.handle(request);
    }
}

// Função para validar participação usando Chain of Responsibility
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
