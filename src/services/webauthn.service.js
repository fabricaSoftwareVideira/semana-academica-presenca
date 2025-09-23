const crypto = require('crypto');
const { generateRegistrationOptions, generateAuthenticationOptions, verifyRegistrationResponse, verifyAuthenticationResponse } = require('@simplewebauthn/server');

class WebAuthnService {
    constructor() {
        // Para localhost, o rpID deve ser exatamente 'localhost'
        // Para produção, use apenas o domínio (ex: 'exemplo.com', não 'https://exemplo.com')
        this.rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
        this.rpName = process.env.WEBAUTHN_RP_NAME || 'Semana Acadêmica';
        this.origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

        // Validação e configuração automática baseada no ambiente
        this.setupEnvironment();

        console.log('🔧 WebAuthn Service inicializado:');
        console.log('   📍 RP ID:', this.rpID);
        console.log('   📍 RP Name:', this.rpName);
        console.log('   🌐 Origin:', this.origin);
        console.log('   🔧 Environment:', process.env.NODE_ENV || 'development');
    }

    setupEnvironment() {
        const isProduction = process.env.NODE_ENV === 'production';
        const isLocalhost = this.origin.includes('localhost') || this.origin.includes('127.0.0.1');

        // Validação para desenvolvimento
        if (!isProduction && isLocalhost && this.rpID !== 'localhost') {
            console.warn('⚠️  Para localhost, o WEBAUTHN_RP_ID deve ser "localhost"');
            this.rpID = 'localhost';
        }

        // Validação para produção
        if (isProduction) {
            if (isLocalhost) {
                console.error('❌ ERRO: Configuração de localhost em produção!');
                throw new Error('Configuração WebAuthn inválida para produção');
            }

            // Extrair domínio do origin para rpID
            try {
                const url = new URL(this.origin);
                const domain = url.hostname;
                if (this.rpID !== domain) {
                    console.warn(`⚠️  Ajustando RP ID de "${this.rpID}" para "${domain}"`);
                    this.rpID = domain;
                }
            } catch (error) {
                console.error('❌ Origin inválido:', this.origin);
                throw new Error('WEBAUTHN_ORIGIN inválido');
            }
        }

        // Validação final
        if (!this.rpID || typeof this.rpID !== 'string') {
            throw new Error('WEBAUTHN_RP_ID é obrigatório e deve ser uma string');
        }
        if (!this.rpName || typeof this.rpName !== 'string') {
            throw new Error('WEBAUTHN_RP_NAME é obrigatório e deve ser uma string');
        }
        if (!this.origin || typeof this.origin !== 'string') {
            throw new Error('WEBAUTHN_ORIGIN é obrigatório e deve ser uma string');
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
            console.log('📋 allowCredentials recebidos:', allowCredentials);
            console.log('📋 Número de credenciais:', allowCredentials.length);

            // Validação de entrada
            if (!Array.isArray(allowCredentials)) {
                throw new Error('allowCredentials deve ser um array');
            }

            // Vamos verificar cada credencial
            const processedCredentials = [];
            allowCredentials.forEach((cred, index) => {
                console.log(`📋 Credencial ${index}:`, {
                    credentialID: typeof cred.credentialID,
                    credentialIDValue: cred.credentialID ? cred.credentialID.substring(0, 20) + '...' : 'undefined',
                    transports: cred.transports
                });

                // Validações críticas
                if (!cred.credentialID) {
                    console.error(`❌ Credencial ${index} não tem credentialID`);
                    throw new Error(`Credencial ${index} não possui credentialID válido`);
                }

                // Verificação de tipo para evitar erro
                let credentialID;
                try {
                    if (typeof cred.credentialID === 'string') {
                        if (cred.credentialID.trim() === '') {
                            throw new Error('credentialID é uma string vazia');
                        }
                        credentialID = new Uint8Array(Buffer.from(cred.credentialID, 'base64url'));
                    } else if (cred.credentialID instanceof Uint8Array) {
                        credentialID = cred.credentialID;
                    } else if (cred.credentialID instanceof Buffer) {
                        credentialID = new Uint8Array(cred.credentialID);
                    } else {
                        throw new Error(`Tipo de credentialID inválido: ${typeof cred.credentialID}`);
                    }

                    processedCredentials.push({
                        id: credentialID,
                        type: 'public-key',
                        transports: cred.transports || ['internal'],
                    });
                } catch (error) {
                    console.error(`❌ Erro ao processar credencial ${index}:`, error.message);
                    console.error('   📋 Credencial problemática:', cred);
                    throw new Error(`Erro ao processar credencial ${index}: ${error.message}`);
                }
            });

            console.log('✅ Credenciais processadas:', processedCredentials.length);

            const options = await generateAuthenticationOptions({
                rpID: this.rpID,
                allowCredentials: processedCredentials,
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
            console.error('📊 Error stack:', error.stack);
            console.error('📊 Input data:', { allowCredentials });
            throw error;
        }
    }

    /**
     * Verifica a resposta de registro
     */
    async verifyRegistrationResponse(response, expectedChallenge, expectedOrigin = this.origin) {
        try {
            console.log('🔧 WebAuthn Service - Verificando resposta de registro...');
            console.log('📋 Response ID:', response.id);
            console.log('🔑 Expected Challenge:', expectedChallenge.slice(0, 20) + '...');

            const verification = await verifyRegistrationResponse({
                response: response,
                expectedChallenge: expectedChallenge,
                expectedOrigin: expectedOrigin,
                expectedRPID: this.rpID,
                requireUserVerification: false,
            });

            console.log('✅ Verificação concluída:', verification.verified);
            console.log('📋 Estrutura da verificação:', Object.keys(verification));

            if (verification.registrationInfo) {
                console.log('📋 Estrutura registrationInfo:', Object.keys(verification.registrationInfo));
            }

            if (verification.verified) {
                // Vamos verificar o que realmente está disponível
                const registrationInfo = verification.registrationInfo;

                console.log('📋 registrationInfo completo:', registrationInfo);

                // Na versão mais recente, pode ser credentialPublicKey diretamente na verificação
                let publicKey;
                if (registrationInfo?.credentialPublicKey) {
                    publicKey = Buffer.from(registrationInfo.credentialPublicKey).toString('base64url');
                } else if (verification.credentialPublicKey) {
                    publicKey = Buffer.from(verification.credentialPublicKey).toString('base64url');
                } else {
                    // Fallback para estrutura do response original
                    publicKey = response.response.attestationObject
                        ? Buffer.from(response.response.attestationObject).toString('base64url')
                        : '';
                }

                return {
                    verified: true,
                    credentialID: response.id,
                    credentialPublicKey: publicKey,
                    counter: registrationInfo?.counter || 0,
                    transports: response.response.transports || ['internal'],
                };
            } else {
                return {
                    verified: false,
                    error: 'Verificação falhou',
                };
            }
        } catch (error) {
            console.error('❌ Erro na verificação de registro:', error);
            return {
                verified: false,
                error: error.message,
            };
        }
    }

    /**
     * Verifica a resposta de autenticação
     */
    async verifyAuthenticationResponse(response, expectedChallenge, storedCredential, expectedOrigin = this.origin) {
        try {
            console.log('🔧 WebAuthn Service - Verificando resposta de autenticação...');
            console.log('📋 storedCredential:', storedCredential);

            // Validações de entrada
            if (!storedCredential.credentialID) {
                throw new Error('credentialID não encontrado na credencial armazenada');
            }
            if (!storedCredential.credentialPublicKey) {
                throw new Error('credentialPublicKey não encontrado na credencial armazenada');
            }

            const verification = await verifyAuthenticationResponse({
                response: response,
                expectedChallenge: expectedChallenge,
                expectedOrigin: expectedOrigin,
                expectedRPID: this.rpID,
                authenticator: {
                    credentialID: new Uint8Array(Buffer.from(storedCredential.credentialID, 'base64url')),
                    credentialPublicKey: new Uint8Array(Buffer.from(storedCredential.credentialPublicKey, 'base64url')),
                    counter: storedCredential.counter || 0,
                    transports: storedCredential.transports || ['internal'],
                },
                requireUserVerification: false,
            }); console.log('✅ Verificação de autenticação concluída:', verification.verified);

            if (verification.verified) {
                return {
                    verified: true,
                    credentialID: response.id,
                    newCounter: verification.authenticationInfo.newCounter,
                };
            } else {
                return {
                    verified: false,
                    error: 'Verificação de autenticação falhou',
                };
            }
        } catch (error) {
            console.error('❌ Erro na verificação de autenticação:', error);
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