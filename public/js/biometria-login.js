document.addEventListener('DOMContentLoaded', async () => {
    const biometriaClient = new BiometriaClient();
    const biometriaSection = document.getElementById('biometria-section');
    const biometriaIndisponivel = document.getElementById('biometria-indisponivel');
    const btnLoginBiometrico = document.getElementById('btn-login-biometrico');
    const usernameInput = document.getElementById('username');

    // Verifica se o navegador suporta biometria
    const suporteBasico = biometriaClient.isSupported();
    const suportePlataforma = await biometriaClient.isPlatformAuthenticatorAvailable();

    if (suporteBasico && suportePlataforma) {
        biometriaSection.style.display = 'block';
    } else {
        biometriaIndisponivel.style.display = 'block';
    }

    // Função para mostrar mensagens
    function mostrarMensagem(tipo, texto) {
        // Remove mensagens anteriores
        document.querySelectorAll('.login-message').forEach(el => el.remove());

        const div = document.createElement('div');
        div.className = `login-message alert ${tipo}`;
        div.style.cssText = `
                    padding: 10px 15px;
                    margin: 10px 0;
                    border-radius: 6px;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                `;

        if (tipo === 'success') {
            div.style.background = '#e8f5e8';
            div.style.color = '#2e7d32';
            div.innerHTML = `<i class="fas fa-check-circle"></i>${texto}`;
        } else if (tipo === 'error') {
            div.style.background = '#ffebee';
            div.style.color = '#c62828';
            div.innerHTML = `<i class="fas fa-exclamation-triangle"></i>${texto}`;
        } else {
            div.style.background = '#e3f2fd';
            div.style.color = '#1565c0';
            div.innerHTML = `<i class="fas fa-info-circle"></i>${texto}`;
        }

        document.querySelector('.login-box').insertBefore(div, document.querySelector('form'));

        // Remove automaticamente após 5 segundos
        setTimeout(() => div.remove(), 5000);
    }

    // Handler do login biométrico
    btnLoginBiometrico.addEventListener('click', async () => {
        const username = usernameInput.value.trim();

        if (!username) {
            mostrarMensagem('error', 'Digite o nome de usuário antes de usar a biometria');
            usernameInput.focus();
            return;
        }

        btnLoginBiometrico.disabled = true;
        btnLoginBiometrico.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Aguarde...';

        try {
            const resultado = await biometriaClient.autenticarBiometria(username);

            if (resultado.success) {
                mostrarMensagem('success', 'Login realizado com sucesso! Redirecionando...');

                // Armazena o token e redireciona
                if (resultado.token) {
                    localStorage.setItem('token', resultado.token);
                }

                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            } else {
                mostrarMensagem('error', resultado.error);
            }
        } catch (error) {
            mostrarMensagem('error', 'Erro inesperado durante o login biométrico');
            console.error('Erro no login biométrico:', error);
        } finally {
            btnLoginBiometrico.disabled = false;
            btnLoginBiometrico.innerHTML = '<i class="fas fa-fingerprint"></i> Login com Biometria';
        }
    });

    // Permite usar Enter no campo username para iniciar biometria
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.altKey && biometriaSection.style.display === 'block') {
            e.preventDefault();
            btnLoginBiometrico.click();
        }
    });
});