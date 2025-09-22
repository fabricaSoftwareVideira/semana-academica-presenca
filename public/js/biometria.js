document.addEventListener('DOMContentLoaded', async () => {
    const biometriaClient = new BiometriaClient();
    const suporteAlert = document.getElementById('suporte-alert');
    const statusBadge = document.getElementById('status-badge');
    const btnConfigurar = document.getElementById('btn-configurar');
    const btnTestar = document.getElementById('btn-testar');
    const credenciaisLista = document.getElementById('credenciais-lista');

    // Função para mostrar alertas
    function mostrarAlerta(tipo, mensagem) {
        // Remove alertas existentes
        document.querySelectorAll('.alert:not(#suporte-alert)').forEach(el => el.remove());

        const alert = document.createElement('div');
        alert.className = `alert ${tipo}`;
        alert.innerHTML = `
                    <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
                    <span>${mensagem}</span>
                `;

        document.querySelector('.section').insertBefore(alert, document.querySelector('.biometria-card'));

        // Remove automaticamente após 5 segundos
        setTimeout(() => alert.remove(), 5000);
    }

    // Verifica suporte inicial
    suporteAlert.style.display = 'flex';

    const suporteBasico = biometriaClient.isSupported();
    const suportePlataforma = await biometriaClient.isPlatformAuthenticatorAvailable();

    suporteAlert.style.display = 'none';

    if (!suporteBasico) {
        mostrarAlerta('error', 'Seu navegador não suporta autenticação biométrica. Atualize para uma versão mais recente.');
        btnConfigurar.disabled = true;
        return;
    }

    if (!suportePlataforma) {
        mostrarAlerta('warning', 'Nenhum autenticador biométrico encontrado neste dispositivo. Verifique se você tem leitor de impressão digital, câmera ou PIN configurado.');
        btnConfigurar.disabled = true;
        return;
    }

    mostrarAlerta('success', 'Seu dispositivo suporta autenticação biométrica!');

    // Carrega credenciais existentes
    await carregarCredenciais();

    // Configurar nova biometria
    btnConfigurar.addEventListener('click', async () => {
        btnConfigurar.classList.add('loading');
        btnConfigurar.disabled = true;

        try {
            const resultado = await biometriaClient.registrarBiometria();

            if (resultado.success) {
                mostrarAlerta('success', resultado.message);
                await carregarCredenciais();
            } else {
                mostrarAlerta('error', resultado.error);
            }
        } catch (error) {
            mostrarAlerta('error', 'Erro inesperado: ' + error.message);
        } finally {
            btnConfigurar.classList.remove('loading');
            btnConfigurar.disabled = false;
        }
    });

    // Testar login biométrico
    btnTestar.addEventListener('click', async () => {
        btnTestar.classList.add('loading');
        btnTestar.disabled = true;

        try {
            const username = '<%= typeof user !== "undefined" ? user.username : "" %>';
            const resultado = await biometriaClient.autenticarBiometria(username);

            if (resultado.success) {
                mostrarAlerta('success', 'Login biométrico funcionou! Você seria redirecionado para o dashboard.');
            } else {
                mostrarAlerta('error', resultado.error);
            }
        } catch (error) {
            mostrarAlerta('error', 'Erro inesperado: ' + error.message);
        } finally {
            btnTestar.classList.remove('loading');
            btnTestar.disabled = false;
        }
    });

    // Carrega e exibe credenciais
    async function carregarCredenciais() {
        try {
            const resultado = await biometriaClient.listarCredenciais();

            if (resultado.success && resultado.credentials.length > 0) {
                statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Ativa';
                statusBadge.className = 'status-badge ativo';
                btnTestar.style.display = 'inline-flex';

                credenciaisLista.innerHTML = resultado.credentials.map(cred => `
                            <div class="credencial-item">
                                <div class="credencial-info">
                                    <div class="biometria-icon">
                                        <i class="fas fa-fingerprint"></i>
                                    </div>
                                    <div>
                                        <strong>Credencial Biométrica</strong>
                                        <br>
                                        <small style="color: #666;">
                                            Criada em: ${new Date(cred.createdAt).toLocaleDateString('pt-BR')}
                                        </small>
                                    </div>
                                </div>
                                <button class="btn btn-danger btn-small" onclick="removerCredencial('${cred.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `).join('');
            } else {
                statusBadge.innerHTML = '<i class="fas fa-times-circle"></i> Inativa';
                statusBadge.className = 'status-badge inativo';
                btnTestar.style.display = 'none';

                credenciaisLista.innerHTML = `
                            <p style="color: #666; text-align: center; padding: 20px;">
                                Nenhuma credencial biométrica configurada
                            </p>
                        `;
            }
        } catch (error) {
            console.error('Erro ao carregar credenciais:', error);
        }
    }

    // Remove credencial
    window.removerCredencial = async (credentialId) => {
        if (!confirm('Tem certeza que deseja remover esta credencial biométrica?')) {
            return;
        }

        try {
            const resultado = await biometriaClient.removerCredencial(credentialId);

            if (resultado.success) {
                mostrarAlerta('success', resultado.message);
                await carregarCredenciais();
            } else {
                mostrarAlerta('error', resultado.error);
            }
        } catch (error) {
            mostrarAlerta('error', 'Erro inesperado: ' + error.message);
        }
    };
});