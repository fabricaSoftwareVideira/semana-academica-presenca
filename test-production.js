const WebAuthnService = require('./src/services/webauthn.service');
const UserModel = require('./src/models/user.model');

// Simular ambiente de produção
process.env.NODE_ENV = 'production';
process.env.WEBAUTHN_RP_ID = 'eventos.fsw-ifc.brdrive.cloud';
process.env.WEBAUTHN_RP_NAME = 'Semana Acadêmica';
process.env.WEBAUTHN_ORIGIN = 'https://eventos.fsw-ifc.brdrive.cloud';

async function testProductionScenario() {
    console.log('🧪 Testando cenário de produção...\n');

    try {
        // Inicializar serviço
        console.log('1️⃣ Inicializando WebAuthn Service...');
        const webauthnService = new WebAuthnService();
        console.log('✅ WebAuthn Service inicializado\n');

        // Testar com usuário que tem credenciais
        console.log('2️⃣ Buscando credenciais do usuário fabricio.bizotto...');
        const credentials = UserModel.getUserWebAuthnCredentials('fabricio.bizotto');
        console.log(`✅ Encontradas ${credentials.length} credenciais\n`);

        if (credentials.length > 0) {
            console.log('3️⃣ Testando geração de opções de autenticação...');
            console.log('📋 Credenciais que serão processadas:');
            credentials.forEach((cred, index) => {
                console.log(`   ${index}:`, {
                    credentialID: typeof cred.credentialID,
                    credentialIDLength: cred.credentialID?.length,
                    credentialIDPreview: cred.credentialID?.substring(0, 20) + '...',
                    hasPublicKey: !!cred.credentialPublicKey,
                    transports: cred.transports,
                    counter: cred.counter
                });
            });

            const { options, challenge } = await webauthnService.generateAuthenticationOptions(credentials);
            console.log('✅ Opções geradas com sucesso!');
            console.log('🔑 Challenge gerado:', challenge.substring(0, 20) + '...');
            console.log('📋 Opções contêm:', Object.keys(options));
        } else {
            console.log('⚠️ Nenhuma credencial encontrada para teste');
        }

        console.log('\n🎉 Teste de produção concluído com sucesso!');

    } catch (error) {
        console.error('\n❌ Erro durante o teste de produção:');
        console.error('📊 Tipo do erro:', error.constructor.name);
        console.error('📊 Mensagem:', error.message);
        console.error('📊 Stack trace:', error.stack);

        // Análise específica para o erro "input.replace is not a function"
        if (error.message.includes('input.replace is not a function')) {
            console.error('\n🔍 ANÁLISE DO ERRO:');
            console.error('Este erro geralmente ocorre quando:');
            console.error('1. Um valor undefined/null é passado onde se espera uma string');
            console.error('2. Parâmetros de configuração estão ausentes ou inválidos');
            console.error('3. Problemas de codificação base64url');

            console.error('\n🔧 VERIFICAÇÕES RECOMENDADAS:');
            console.error('1. Verificar se WEBAUTHN_RP_ID está definido corretamente');
            console.error('2. Verificar se WEBAUTHN_ORIGIN está definido corretamente');
            console.error('3. Verificar se credentialID está em formato base64url válido');
        }
    }
}

// Executar teste
testProductionScenario().catch(console.error);