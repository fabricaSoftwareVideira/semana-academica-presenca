const crypto = require('crypto');
const { generateRegistrationOptions, generateAuthenticationOptions } = require('@simplewebauthn/server');

class WebAuthnService {
    constructor() {
        // Para localhost, o rpID deve ser exatamente 'localhost'
        // Para produção, use apenas o domínio (ex: 'exemplo.com', não 'https://exemplo.com')
        this.rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
        this.rpName = process.env.WEBAUTHN_RP_NAME || 'Semana Acadêmica';
        this.origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

        // Validação do rpID para desenvolvimento
        if (this.origin.includes('localhost') && this.rpID !== 'localhost') {
            console.warn('⚠️  Para localhost, o WEBAUTHN_RP_ID deve ser "localhost"');
            this.rpID = 'localhost';
        }
    }

    /**
     * Gera opções para registro de credencial biométrica
     */
    async generateRegistrationOptions(user) {
        try {
            console.log('🔧 WebAuthn Service - Iniciando geração de opções...');
            console.log('📋 Dados do usuário:', { id: user.id, username: user.username, name: user.name });

            const userID = new Uint8Array(Buffer.from(user.id.toString()));
            console.log('🆔 User ID Buffer criado:', Array.from(userID));

            console.log('⚙️  Configurações WebAuthn:');
            console.log('   📍 RP Name:', this.rpName);
            console.log('   📍 RP ID:', this.rpID);
            console.log('   🌐 Origin:', this.origin);

            if (this.rpID === 'localhost') {
                console.log('⚠️  DEVELOPMENT MODE: Using localhost as Relying Party ID');
            }

            const registrationOptions = {
                rpName: this.rpName,
                rpID: this.rpID,
                userID,
                userName: user.username,
                userDisplayName: user.name || user.username,
                timeout: 60000,
                attestationType: 'none',
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    userVerification: 'preferred',
                },
                supportedAlgorithmIDs: [-7, -257],
            };

            console.log('📝 Opções que serão passadas para generateRegistrationOptions:', {
                ...registrationOptions,
                userID: Array.from(userID) // Para visualização
            });

            const options = await generateRegistrationOptions(registrationOptions);

            console.log('✅ Opções geradas com sucesso');
            console.log('� Estrutura das opções:', Object.keys(options));

            if (options.challenge) {
                console.log('�🔑 Challenge gerado:', options.challenge.slice(0, 20) + '...');
            } else {
                console.log('⚠️ Challenge não encontrado nas opções!');
                console.log('📋 Opções completas:', options);
            }

            return {
                options,
                challenge: options.challenge,
                userID: Buffer.from(userID).toString('base64url'),
            };
        } catch (error) {
            console.error('❌ Error generating registration options:', error);
            console.error('📊 Error stack:', error.stack);
            console.error('📊 Error details:', {
                name: error.name,
                message: error.message,
                code: error.code
            });
            throw error;
        }
    }

    /**
     * Gera opções para autenticação biométrica
     */
    async generateAuthenticationOptions(allowCredentials = []) {
        try {
            console.log('🔧 WebAuthn Service - Gerando opções de autenticação...');

            const options = await generateAuthenticationOptions({
                rpID: this.rpID,
                allowCredentials: allowCredentials.map(cred => ({
                    id: new Uint8Array(Buffer.from(cred.credentialID, 'base64url')),
                    type: 'public-key',
                    transports: cred.transports || ['internal'],
                })),
                userVerification: 'preferred',
                timeout: 60000,
            });

            console.log('✅ Opções de autenticação geradas com sucesso');

            return {
                options,
                challenge: options.challenge,
            };
        } catch (error) {
            console.error('❌ Error generating authentication options:', error);
            throw error;
        }
    }

    /**
     * Verifica a resposta de registro
     */
    verifyRegistrationResponse(response, expectedChallenge, expectedOrigin = this.origin) {
        try {
            // Validações básicas
            if (!response.id || !response.rawId || !response.response) {
                throw new Error('Resposta de registro inválida');
            }

            // Decodifica os dados
            const clientDataJSON = JSON.parse(
                Buffer.from(response.response.clientDataJSON, 'base64url').toString()
            );

            // Verifica o challenge
            if (clientDataJSON.challenge !== expectedChallenge) {
                throw new Error('Challenge inválido');
            }

            // Verifica a origem
            if (clientDataJSON.origin !== expectedOrigin) {
                throw new Error('Origem inválida');
            }

            // Verifica o tipo
            if (clientDataJSON.type !== 'webauthn.create') {
                throw new Error('Tipo de operação inválido');
            }

            return {
                verified: true,
                credentialID: response.id,
                credentialPublicKey: response.response.attestationObject,
                counter: 0,
                transports: response.response.getTransports?.() || ['internal'],
            };
        } catch (error) {
            return {
                verified: false,
                error: error.message,
            };
        }
    }

    /**
     * Verifica a resposta de autenticação
     */
    verifyAuthenticationResponse(response, expectedChallenge, storedCredential, expectedOrigin = this.origin) {
        try {
            // Validações básicas
            if (!response.id || !response.rawId || !response.response) {
                throw new Error('Resposta de autenticação inválida');
            }

            // Decodifica os dados
            const clientDataJSON = JSON.parse(
                Buffer.from(response.response.clientDataJSON, 'base64url').toString()
            );

            // Verifica o challenge
            if (clientDataJSON.challenge !== expectedChallenge) {
                throw new Error('Challenge inválido');
            }

            // Verifica a origem
            if (clientDataJSON.origin !== expectedOrigin) {
                throw new Error('Origem inválida');
            }

            // Verifica o tipo
            if (clientDataJSON.type !== 'webauthn.get') {
                throw new Error('Tipo de operação inválido');
            }

            // Verifica se o credential ID corresponde
            if (response.id !== storedCredential.credentialID) {
                throw new Error('Credencial não reconhecida');
            }

            return {
                verified: true,
                credentialID: response.id,
                newCounter: parseInt(response.response.signature) || storedCredential.counter + 1,
            };
        } catch (error) {
            return {
                verified: false,
                error: error.message,
            };
        }
    }

    /**
     * Verifica se o navegador suporta WebAuthn
     */
    static isSupported() {
        return typeof navigator !== 'undefined' &&
            typeof navigator.credentials !== 'undefined' &&
            typeof navigator.credentials.create === 'function';
    }
}

module.exports = WebAuthnService;