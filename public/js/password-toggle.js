document.addEventListener('DOMContentLoaded', () => {
    // Para cada input tipo password que não esteja dentro de .password-field,
    // encapsulamos e adicionamos o botão. Também suportamos inputs já dentro do wrapper.

    const ensureWrapper = (input) => {
        if (!input) return null;
        // Se já estiver em um wrapper .password-field, retorne o wrapper
        const existing = input.closest('.password-field');
        if (existing) return existing;

        // Criar wrapper e mover o input para dentro
        const wrapper = document.createElement('div');
        wrapper.className = 'password-field';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        return wrapper;
    };

    const inputs = Array.from(document.querySelectorAll('input[type="password"]'));
    inputs.forEach(input => {
        const wrapper = ensureWrapper(input);
        if (!wrapper) return;

        // Criar botão
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'password-toggle-btn';
        btn.setAttribute('aria-label', 'Mostrar senha');
        btn.setAttribute('aria-pressed', 'false');

        // Usar FontAwesome se disponível
        const useFA = !!document.querySelector('link[href*="font-awesome"], link[href*="fontawesome"], .fa, .fas, .far');
        if (useFA) {
            btn.innerHTML = '<i class="fa fa-eye" aria-hidden="true"></i>';
        } else {
            btn.textContent = '\u{1F441}';
        }

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (input.type === 'password') {
                input.type = 'text';
                btn.setAttribute('aria-label', 'Ocultar senha');
                btn.setAttribute('aria-pressed', 'true');
                if (useFA && btn.firstElementChild) {
                    btn.firstElementChild.classList.remove('fa-eye');
                    btn.firstElementChild.classList.add('fa-eye-slash');
                }
            } else {
                input.type = 'password';
                btn.setAttribute('aria-label', 'Mostrar senha');
                btn.setAttribute('aria-pressed', 'false');
                if (useFA && btn.firstElementChild) {
                    btn.firstElementChild.classList.remove('fa-eye-slash');
                    btn.firstElementChild.classList.add('fa-eye');
                }
            }
            input.focus();
        });

        // Inserir botão somente se não houver um já
        if (!wrapper.querySelector('.password-toggle-btn')) {
            wrapper.appendChild(btn);
        }
    });
});
