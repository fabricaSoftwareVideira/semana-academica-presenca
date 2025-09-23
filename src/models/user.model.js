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
    const user = getUserByUsername(username);
    console.log('👤 Usuário encontrado:', !!user);
    console.log('🔐 Propriedade webauthnCredentials existe:', !!user?.webauthnCredentials);
    console.log('🔐 Número de credenciais:', user?.webauthnCredentials?.length || 0);

    if (user?.webauthnCredentials) {
        console.log('📋 Detalhes das credenciais:', user.webauthnCredentials.map(c => ({
            id: c.credentialID,
            hasPublicKey: !!c.credentialPublicKey,
            transports: c.transports
        })));
    }

    return user?.webauthnCredentials || [];
}

module.exports = {
    getAllUsers,
    saveUsers,
    getUserByUsername,
    updateUser,
    addWebAuthnCredential,
    getUserWebAuthnCredentials,
};
