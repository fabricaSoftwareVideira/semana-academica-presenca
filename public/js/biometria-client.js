/**
 * Cliente JavaScript para Autenticação Biométrica
 * Utiliza a Web Authentication API (WebAuthn)
 */
class BiometriaClient {
    constructor() {
        this.baseURL = '/api/biometria';
    }

    /**
     * Verifica se o navegador suporta WebAuthn
     */
    isSupported() {
        return window.PublicKeyCredential &&
            navigator.credentials &&
            navigator.credentials.create;
    }

    /**
     * Verifica se há suporte para autenticação de plataforma (biometria)
     */
    async isPlatformAuthenticatorAvailable() {
        if (!this.isSupported()) {
            return false;
        }

        try {
            return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch (error) {
            console.warn('Erro ao verificar autenticador de plataforma:', error);
            return false;
        }
    }

    /**
     * Converte ArrayBuffer para base64url
     */
    bufferToBase64url(buffer) {
        const bytes = new Uint8Array(buffer);
        let str = '';
        for (const charCode of bytes) {
            str += String.fromCharCode(charCode);
        }
        return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    /**
     * Converte base64url para ArrayBuffer
     */
    base64urlToBuffer(base64url) {
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
        const binary = atob(padded);
        const buffer = new ArrayBuffer(binary.length);
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return buffer;
    }

    /**
     * Prepara as opções para o navegador
     */
    prepareCredentialOptions(options) {
        // Converte challenge para ArrayBuffer
        options.challenge = this.base64urlToBuffer(options.challenge);

        // Converte user.id se existir (para registro)
        if (options.user && options.user.id) {
            options.user.id = this.base64urlToBuffer(options.user.id);
        }

        // Converte allowCredentials se existir (para autenticação)
        if (options.allowCredentials) {
            options.allowCredentials = options.allowCredentials.map(cred => ({
                ...cred,
                id: this.base64urlToBuffer(cred.id),
            }));
        }

        return options;
    }

    /**
     * Prepara a resposta para envio ao servidor
     */
    prepareCredentialResponse(credential) {
        const response = {
            id: credential.id,
            rawId: this.bufferToBase64url(credential.rawId),
            response: {},
            type: credential.type,
        };

        if (credential.response.attestationObject) {
            // Resposta de registro
            response.response = {
                attestationObject: this.bufferToBase64url(credential.response.attestationObject),
                clientDataJSON: this.bufferToBase64url(credential.response.clientDataJSON),
            };

            if (credential.response.getTransports) {
                response.response.getTransports = credential.response.getTransports();
            }
        } else {
            // Resposta de autenticação
            response.response = {
                authenticatorData: this.bufferToBase64url(credential.response.authenticatorData),
                clientDataJSON: this.bufferToBase64url(credential.response.clientDataJSON),
                signature: this.bufferToBase64url(credential.response.signature),
            };

            if (credential.response.userHandle) {
                response.response.userHandle = this.bufferToBase64url(credential.response.userHandle);
            }
        }

        return response;
    }

    /**
     * Registra uma nova credencial biométrica
     */
    async registrarBiometria() {
        try {
            if (!this.isSupported()) {
                throw new Error('Seu navegador não suporta autenticação biométrica');
            }

            if (!(await this.isPlatformAuthenticatorAvailable())) {
                throw new Error('Nenhum autenticador biométrico encontrado neste dispositivo');
            }

            // Inicia o registro
            const iniciarResponse = await fetch(`${this.baseURL}/registrar/iniciar`, {
                method: 'POST',
                credentials: 'include', // Inclui cookies de sessão
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!iniciarResponse.ok) {
                const error = await iniciarResponse.json();
                throw new Error(error.error || 'Erro ao iniciar registro');
            }

            const { options } = await iniciarResponse.json();
            const preparedOptions = this.prepareCredentialOptions(options);

            // Cria a credencial
            const credential = await navigator.credentials.create({
                publicKey: preparedOptions,
            });

            if (!credential) {
                throw new Error('Falha ao criar credencial');
            }

            const credentialData = this.prepareCredentialResponse(credential);

            // Finaliza o registro
            const finalizarResponse = await fetch(`${this.baseURL}/registrar/finalizar`, {
                method: 'POST',
                credentials: 'include', // Inclui cookies de sessão
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ credential: credentialData }),
            });

            if (!finalizarResponse.ok) {
                const error = await finalizarResponse.json();
                throw new Error(error.error || 'Erro ao finalizar registro');
            }

            const result = await finalizarResponse.json();
            return { success: true, message: result.message };

        } catch (error) {
            console.error('Erro no registro biométrico:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Autentica usando biometria
     */
    async autenticarBiometria(username) {
        try {
            if (!this.isSupported()) {
                throw new Error('Seu navegador não suporta autenticação biométrica');
            }

            if (!username) {
                throw new Error('Nome de usuário é obrigatório');
            }

            // Inicia a autenticação
            const iniciarResponse = await fetch(`${this.baseURL}/autenticar/iniciar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }),
            });

            if (!iniciarResponse.ok) {
                const error = await iniciarResponse.json();
                throw new Error(error.error || 'Erro ao iniciar autenticação');
            }

            const { options } = await iniciarResponse.json();
            const preparedOptions = this.prepareCredentialOptions(options);

            // Obtém a credencial
            const credential = await navigator.credentials.get({
                publicKey: preparedOptions,
            });

            if (!credential) {
                throw new Error('Falha na autenticação');
            }

            const credentialData = this.prepareCredentialResponse(credential);

            // Finaliza a autenticação
            const finalizarResponse = await fetch(`${this.baseURL}/autenticar/finalizar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    credential: credentialData,
                    username,
                }),
            });

            if (!finalizarResponse.ok) {
                const error = await finalizarResponse.json();
                throw new Error(error.error || 'Erro ao finalizar autenticação');
            }

            const result = await finalizarResponse.json();

            // Armazena o token se a autenticação foi bem-sucedida
            if (result.token) {
                localStorage.setItem('token', result.token);
            }

            return {
                success: true,
                message: result.message,
                user: result.user,
                token: result.token,
            };

        } catch (error) {
            console.error('Erro na autenticação biométrica:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Lista as credenciais do usuário
     */
    async listarCredenciais() {
        try {
            const response = await fetch(`${this.baseURL}/credenciais`, {
                method: 'GET',
                credentials: 'include', // Inclui cookies de sessão
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao listar credenciais');
            }

            const { credentials } = await response.json();
            return { success: true, credentials };

        } catch (error) {
            console.error('Erro ao listar credenciais:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Remove uma credencial
     */
    async removerCredencial(credentialId) {
        try {
            const response = await fetch(`${this.baseURL}/credenciais/${credentialId}`, {
                method: 'DELETE',
                credentials: 'include', // Inclui cookies de sessão
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao remover credencial');
            }

            const result = await response.json();
            return { success: true, message: result.message };

        } catch (error) {
            console.error('Erro ao remover credencial:', error);
            return { success: false, error: error.message };
        }
    }
}

// Torna disponível globalmente
window.BiometriaClient = BiometriaClient;