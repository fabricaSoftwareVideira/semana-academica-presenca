const WebAuthnService = require('../services/webauthn.service');
const UserModel = require('../models/user.model');

class BiometriaController {
    constructor() {
        this.webauthnService = new WebAuthnService();
        this.pendingChallenges = new Map(); // Em produção, usar Redis ou banco
    }

    /**
     * Inicia o registro de biometria
     */
    iniciarRegistroBiometria = async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Usuário não autenticado' });
            }

            const user = UserModel.getUserByUsername(req.user.username);
            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            const { options, challenge, userID } = this.webauthnService.generateRegistrationOptions(user);

            // Armazena o challenge temporariamente
            this.pendingChallenges.set(req.user.username, {
                challenge,
                userID,
                timestamp: Date.now(),
            });

            // Remove challenges antigos (cleanup)
            this.cleanupOldChallenges();

            res.json({ options });
        } catch (error) {
            console.error('Erro ao iniciar registro de biometria:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    };

    /**
     * Finaliza o registro de biometria
     */
    finalizarRegistroBiometria = async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Usuário não autenticado' });
            }

            const { credential } = req.body;
            const pendingChallenge = this.pendingChallenges.get(req.user.username);

            if (!pendingChallenge) {
                return res.status(400).json({ error: 'Challenge não encontrado ou expirado' });
            }

            const verification = this.webauthnService.verifyRegistrationResponse(
                credential,
                pendingChallenge.challenge
            );

            if (!verification.verified) {
                return res.status(400).json({ error: verification.error });
            }

            // Salva a credencial no usuário
            const credentialData = {
                credentialID: verification.credentialID,
                credentialPublicKey: verification.credentialPublicKey,
                counter: verification.counter,
                transports: verification.transports,
                userID: pendingChallenge.userID,
            };

            UserModel.addWebAuthnCredential(req.user.username, credentialData);

            // Remove o challenge usado
            this.pendingChallenges.delete(req.user.username);

            res.json({
                verified: true,
                message: 'Biometria registrada com sucesso!'
            });
        } catch (error) {
            console.error('Erro ao finalizar registro de biometria:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    };

    /**
     * Inicia a autenticação por biometria
     */
    iniciarAutenticacaoBiometria = async (req, res) => {
        try {
            const { username } = req.body;

            if (!username) {
                return res.status(400).json({ error: 'Nome de usuário é obrigatório' });
            }

            const credentials = UserModel.getUserWebAuthnCredentials(username);

            if (credentials.length === 0) {
                return res.status(400).json({
                    error: 'Nenhuma credencial biométrica encontrada para este usuário'
                });
            }

            const { options, challenge } = this.webauthnService.generateAuthenticationOptions(credentials);

            // Armazena o challenge temporariamente
            this.pendingChallenges.set(`auth_${username}`, {
                challenge,
                username,
                timestamp: Date.now(),
            });

            // Remove challenges antigos
            this.cleanupOldChallenges();

            res.json({ options });
        } catch (error) {
            console.error('Erro ao iniciar autenticação biométrica:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    };

    /**
     * Finaliza a autenticação por biometria
     */
    finalizarAutenticacaoBiometria = async (req, res) => {
        try {
            const { credential, username } = req.body;
            const pendingChallenge = this.pendingChallenges.get(`auth_${username}`);

            if (!pendingChallenge) {
                return res.status(400).json({ error: 'Challenge não encontrado ou expirado' });
            }

            const user = UserModel.getUserByUsername(username);
            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            const userCredentials = UserModel.getUserWebAuthnCredentials(username);
            const storedCredential = userCredentials.find(
                cred => cred.credentialID === credential.id
            );

            if (!storedCredential) {
                return res.status(400).json({ error: 'Credencial não reconhecida' });
            }

            const verification = this.webauthnService.verifyAuthenticationResponse(
                credential,
                pendingChallenge.challenge,
                storedCredential
            );

            if (!verification.verified) {
                return res.status(400).json({ error: verification.error });
            }

            // Atualiza o contador da credencial
            const updatedCredentials = userCredentials.map(cred =>
                cred.credentialID === verification.credentialID
                    ? { ...cred, counter: verification.newCounter }
                    : cred
            );

            UserModel.updateUser(username, { webauthnCredentials: updatedCredentials });

            // Remove o challenge usado
            this.pendingChallenges.delete(`auth_${username}`);

            // Gera token JWT (reutilizando a lógica existente)
            const jwtService = require('../services/jwt.service');
            const token = jwtService.gerarToken({ username: user.username });

            res.json({
                verified: true,
                message: 'Autenticação biométrica realizada com sucesso!',
                token,
                user: {
                    username: user.username,
                    isAdmin: user.isAdmin,
                    isOrganizador: user.isOrganizador,
                    isConvidado: user.isConvidado,
                }
            });
        } catch (error) {
            console.error('Erro ao finalizar autenticação biométrica:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    };

    /**
     * Lista credenciais biométricas do usuário
     */
    listarCredenciais = async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Usuário não autenticado' });
            }

            const credentials = UserModel.getUserWebAuthnCredentials(req.user.username);

            // Remove dados sensíveis antes de enviar
            const safeCredentials = credentials.map(cred => ({
                id: cred.credentialID,
                createdAt: cred.createdAt,
                transports: cred.transports,
            }));

            res.json({ credentials: safeCredentials });
        } catch (error) {
            console.error('Erro ao listar credenciais:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    };

    /**
     * Remove uma credencial biométrica
     */
    removerCredencial = async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Usuário não autenticado' });
            }

            const { credentialId } = req.params;
            const user = UserModel.getUserByUsername(req.user.username);

            if (!user.webauthnCredentials) {
                return res.status(404).json({ error: 'Nenhuma credencial encontrada' });
            }

            const updatedCredentials = user.webauthnCredentials.filter(
                cred => cred.credentialID !== credentialId
            );

            UserModel.updateUser(req.user.username, {
                webauthnCredentials: updatedCredentials
            });

            res.json({ message: 'Credencial removida com sucesso!' });
        } catch (error) {
            console.error('Erro ao remover credencial:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    };

    /**
     * Remove challenges antigos (mais de 5 minutos)
     */
    cleanupOldChallenges() {
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

        for (const [key, challenge] of this.pendingChallenges.entries()) {
            if (challenge.timestamp < fiveMinutesAgo) {
                this.pendingChallenges.delete(key);
            }
        }
    }
}

module.exports = new BiometriaController();