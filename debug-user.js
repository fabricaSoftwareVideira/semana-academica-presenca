const UserModel = require('./src/models/user.model');

console.log('🧪 Testando UserModel diretamente...');

const user = UserModel.getUserByUsername('fabricio.bizotto');
console.log('Usuário encontrado:', !!user);
console.log('Tem webauthnCredentials:', !!user?.webauthnCredentials);
console.log('Número de credenciais:', user?.webauthnCredentials?.length || 0);

if (user?.webauthnCredentials) {
    console.log('Primeira credencial ID:', user.webauthnCredentials[0]?.credentialID);
    console.log('Estrutura completa da credencial:', user.webauthnCredentials[0]);
}

// Teste da função específica
const credentials = UserModel.getUserWebAuthnCredentials('fabricio.bizotto');
console.log('\n📋 Resultado da função getUserWebAuthnCredentials:');
console.log('Número de credenciais retornadas:', credentials.length);