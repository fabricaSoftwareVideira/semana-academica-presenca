const fs = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, '../data/users.json');

function migrateWebAuthnCredentials() {
    console.log('🔧 Iniciando migração de credenciais WebAuthn...');

    try {
        // Ler usuários
        const data = fs.readFileSync(USERS_PATH, 'utf-8');
        const users = JSON.parse(data);

        console.log(`📋 Encontrados ${users.length} usuários`);

        let updatedUsers = false;

        users.forEach((user, userIndex) => {
            if (user.webauthnCredentials && Array.isArray(user.webauthnCredentials)) {
                console.log(`👤 Verificando usuário: ${user.username}`);
                console.log(`   📋 ${user.webauthnCredentials.length} credenciais encontradas`);

                // Filtrar credenciais válidas
                const validCredentials = user.webauthnCredentials.filter((cred, credIndex) => {
                    let isValid = true;
                    const issues = [];

                    // Verificar credentialID
                    if (!cred.credentialID) {
                        issues.push('credentialID ausente');
                        isValid = false;
                    } else if (typeof cred.credentialID !== 'string') {
                        issues.push(`credentialID tipo inválido: ${typeof cred.credentialID}`);
                        isValid = false;
                    } else if (cred.credentialID.trim() === '') {
                        issues.push('credentialID vazio');
                        isValid = false;
                    }

                    // Verificar credentialPublicKey
                    if (!cred.credentialPublicKey) {
                        issues.push('credentialPublicKey ausente');
                        isValid = false;
                    } else if (typeof cred.credentialPublicKey !== 'string') {
                        issues.push(`credentialPublicKey tipo inválido: ${typeof cred.credentialPublicKey}`);
                        isValid = false;
                    }

                    // Verificar counter
                    if (cred.counter !== undefined && typeof cred.counter !== 'number') {
                        issues.push(`counter tipo inválido: ${typeof cred.counter}`);
                        // Tentar corrigir
                        cred.counter = parseInt(cred.counter) || 0;
                        console.log(`   ✅ Corrigido counter para credencial ${credIndex}`);
                    }

                    // Verificar transports
                    if (cred.transports && !Array.isArray(cred.transports)) {
                        issues.push('transports não é array');
                        cred.transports = ['internal']; // Valor padrão
                        console.log(`   ✅ Corrigido transports para credencial ${credIndex}`);
                    }

                    if (issues.length > 0) {
                        console.log(`   ❌ Credencial ${credIndex} inválida: ${issues.join(', ')}`);
                    } else {
                        console.log(`   ✅ Credencial ${credIndex} válida`);
                    }

                    return isValid;
                });

                if (validCredentials.length !== user.webauthnCredentials.length) {
                    console.log(`   🔧 Removendo ${user.webauthnCredentials.length - validCredentials.length} credenciais inválidas`);
                    users[userIndex].webauthnCredentials = validCredentials;
                    updatedUsers = true;
                }

                console.log(`   📋 Credenciais válidas restantes: ${validCredentials.length}`);
            }
        });

        if (updatedUsers) {
            // Fazer backup
            const backupPath = USERS_PATH + '.backup.' + Date.now();
            fs.writeFileSync(backupPath, data);
            console.log(`💾 Backup criado: ${backupPath}`);

            // Salvar dados corrigidos
            fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
            console.log('✅ Dados corrigidos salvos');
        } else {
            console.log('✅ Nenhuma correção necessária');
        }

        console.log('🎉 Migração concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    migrateWebAuthnCredentials();
}

module.exports = { migrateWebAuthnCredentials };