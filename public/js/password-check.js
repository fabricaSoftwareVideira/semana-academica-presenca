// Validação de senha com acessibilidade melhorada
document.addEventListener('DOMContentLoaded', () => {
    const LIVE_ID = 'password-check-live';

    // criar região live se não existir
    let live = document.getElementById(LIVE_ID);
    if (!live) {
        live = document.createElement('div');
        live.id = LIVE_ID;
        live.setAttribute('role', 'status');
        live.setAttribute('aria-live', 'polite');
        // visually hidden but available to assistive tech
        live.style.position = 'absolute';
        live.style.width = '1px';
        live.style.height = '1px';
        live.style.margin = '-1px';
        live.style.border = '0';
        live.style.padding = '0';
        live.style.overflow = 'hidden';
        live.style.clip = 'rect(0 0 0 0)';
        document.body && document.body.appendChild(live);
    }

    // Encontrar formulários que têm campos de senha relevantes
    const forms = Array.from(document.querySelectorAll('form')).filter(f =>
        f.querySelector('#novaSenha') || f.querySelector('#confirmarSenha') || f.querySelector('input[name="novaSenha"]')
    );

    forms.forEach((form) => {
        const nova = form.querySelector('#novaSenha') || form.querySelector('input[name="novaSenha"]');
        const confirmar = form.querySelector('#confirmarSenha') || form.querySelector('input[name="confirmarSenha"]');

        const makeErrorNode = (input, id, msg) => {
            if (!input) return null;
            // remove existing
            const existing = document.getElementById(id);
            if (existing) existing.remove();
            const err = document.createElement('div');
            err.id = id;
            err.className = 'password-error-message';
            err.textContent = msg;
            err.setAttribute('role', 'alert');
            return err;
        };

        const showError = (input, message) => {
            if (!input) return;
            const errId = `${input.id || input.name}-error`;
            const errNode = makeErrorNode(input, errId, message);
            // associate
            input.setAttribute('aria-invalid', 'true');
            input.setAttribute('aria-describedby', errId);
            // insert after the .password-field wrapper if present, otherwise after the input
            if (errNode) {
                const wrapper = input.closest('.password-field');
                if (wrapper && wrapper.parentNode) {
                    wrapper.parentNode.insertBefore(errNode, wrapper.nextSibling);
                } else if (input.parentNode) {
                    input.parentNode.insertBefore(errNode, input.nextSibling);
                }
                live.textContent = message; // announce
            }
        };

        const clearError = (input) => {
            if (!input) return;
            input.removeAttribute('aria-invalid');
            const errId = `${input.id || input.name}-error`;
            const existing = document.getElementById(errId);
            if (existing) existing.remove();
            if (live) live.textContent = '';
            input.removeAttribute('aria-describedby');
        };

        // Real-time feedback for mismatch
        const validateMatchLive = () => {
            if (!nova || !confirmar) return;
            if (confirmar.value && nova.value !== confirmar.value) {
                confirmar.setAttribute('aria-invalid', 'true');
                live.textContent = 'As senhas não coincidem.';
            } else {
                clearError(confirmar);
            }
        };

        if (nova && confirmar) {
            nova.addEventListener('input', validateMatchLive);
            confirmar.addEventListener('input', validateMatchLive);
        }

        form.addEventListener('submit', function (e) {
            // clear previous
            if (nova) clearError(nova);
            if (confirmar) clearError(confirmar);

            const vNova = nova ? nova.value.trim() : null;
            const vConf = confirmar ? confirmar.value.trim() : null;

            // Validation: length first
            if (vNova !== null && vNova.length < 6) {
                e.preventDefault();
                showError(nova, 'A senha deve ter pelo menos 6 caracteres.');
                nova.focus();
                return false;
            }

            // Validation: match
            if (vNova !== null && vConf !== null && vNova !== vConf) {
                e.preventDefault();
                showError(confirmar, 'As senhas não coincidem.');
                confirmar.focus();
                return false;
            }

            // tudo ok — garantir que mensagens anteriores sejam limpas
            if (nova) clearError(nova);
            if (confirmar) clearError(confirmar);
            return true;
        });
    });

});