const fs = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, '../data/users.json');

function getAllUsers() {
    const data = fs.readFileSync(USERS_PATH, 'utf-8');
    return JSON.parse(data);
}

function saveUsers(users) {
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

function getUserByUsername(username) {
    const users = getAllUsers();
    return users.find(user => user.username === username);
}

function updateUser(username, updates) {
    const users = getAllUsers();
    const userIndex = users.findIndex(user => user.username === username);

    if (userIndex === -1) {
        throw new Error('Usuário não encontrado');
    }

    users[userIndex] = { ...users[userIndex], ...updates };
    saveUsers(users);

    return users[userIndex];
}

function addWebAuthnCredential(username, credential) {
    const users = getAllUsers();
    const userIndex = users.findIndex(user => user.username === username);

    if (userIndex === -1) {
        throw new Error('Usuário não encontrado');
    }

    if (!users[userIndex].webauthnCredentials) {
        users[userIndex].webauthnCredentials = [];
    }

    users[userIndex].webauthnCredentials.push({
        ...credential,
        createdAt: new Date().toISOString(),
    });

    saveUsers(users);
    return users[userIndex];
}

function getUserWebAuthnCredentials(username) {
    console.log('🔍 UserModel - Buscando credenciais para:', username);

    if (!username || typeof username !== 'string') {
        console.error('❌ Username inválido:', username);
        return [];
    }

    const user = getUserByUsername(username);
    console.log('👤 Usuário encontrado:', !!user);
    console.log('🔐 Propriedade webauthnCredentials existe:', !!user?.webauthnCredentials);
    console.log('🔐 Número de credenciais:', user?.webauthnCredentials?.length || 0);

    if (!user || !user.webauthnCredentials || !Array.isArray(user.webauthnCredentials)) {
        console.log('ℹ️ Nenhuma credencial encontrada ou estrutura inválida');
        return [];
    }

    // Validar e filtrar credenciais válidas
    const validCredentials = user.webauthnCredentials.filter((cred, index) => {
        if (!cred.credentialID) {
            console.warn(`⚠️ Credencial ${index} sem credentialID`);
            return false;
        }
        if (typeof cred.credentialID !== 'string' || cred.credentialID.trim() === '') {
            console.warn(`⚠️ Credencial ${index} com credentialID inválido:`, typeof cred.credentialID);
            return false;
        }
        if (!cred.credentialPublicKey) {
            console.warn(`⚠️ Credencial ${index} sem credentialPublicKey`);
            return false;
        }
        return true;
    });

    console.log('✅ Credenciais válidas:', validCredentials.length);

    if (validCredentials.length > 0) {
        console.log('📋 Detalhes das credenciais válidas:', validCredentials.map(c => ({
            id: c.credentialID.substring(0, 20) + '...',
            hasPublicKey: !!c.credentialPublicKey,
            transports: c.transports,
            counter: c.counter
        })));
    }

    return validCredentials;
}

module.exports = {
    getAllUsers,
    saveUsers,
    getUserByUsername,
    updateUser,
    addWebAuthnCredential,
    getUserWebAuthnCredentials,
};
