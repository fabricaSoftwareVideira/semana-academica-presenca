const crypto = require('crypto');

class WebAuthnService {
    constructor() {
        this.rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
        this.rpName = process.env.WEBAUTHN_RP_NAME || 'Semana Acadêmica';
        this.origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';
    }

    /**
     * Gera opções para registro de credencial biométrica
     */
    generateRegistrationOptions(user) {
        const challenge = crypto.randomBytes(32);
        const userID = crypto.randomBytes(64);

        const options = {
            challenge: challenge.toString('base64url'),
            rp: {
                name: this.rpName,
                id: this.rpID,
            },
            user: {
                id: userID.toString('base64url'),
                name: user.username,
                displayName: user.username,
            },
            pubKeyCredParams: [
                { alg: -7, type: 'public-key' }, // ES256
                { alg: -257, type: 'public-key' }, // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: 'platform', // biometria do dispositivo
                userVerification: 'required',
                requireResidentKey: false,
            },
            attestation: 'direct',
            timeout: 60000,
        };

        return {
            options,
            challenge: challenge.toString('base64url'),
            userID: userID.toString('base64url'),
        };
    }

    /**
     * Gera opções para autenticação biométrica
     */
    generateAuthenticationOptions(allowCredentials = []) {
        const challenge = crypto.randomBytes(32);

        const options = {
            challenge: challenge.toString('base64url'),
            allowCredentials: allowCredentials.map(cred => ({
                id: cred.credentialID,
                type: 'public-key',
                transports: cred.transports || ['internal'],
            })),
            userVerification: 'required',
            timeout: 60000,
        };

        return {
            options,
            challenge: challenge.toString('base64url'),
        };
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