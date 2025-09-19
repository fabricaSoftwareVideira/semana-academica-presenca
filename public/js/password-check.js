// Validação no frontend
document.querySelector('form').addEventListener('submit', function (e) {
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;

    if (novaSenha !== confirmarSenha) {
        e.preventDefault();
        alert('As senhas não coincidem!');
        return false;
    }

    if (novaSenha.length < 6) {
        e.preventDefault();
        alert('A senha deve ter pelo menos 6 caracteres!');
        return false;
    }
});