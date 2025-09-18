const AuthService = require("../services/auth.service.js");
const AuthValidation = require("../services/auth.validation.js");
const { userView } = require('../utils/user-view.utils.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

exports.loginPage = (req, res) => {
    res.render("login", { user: userView(req.user) });
};

exports.criarSenhaPage = (req, res) => {
    if (!req.user) {
        return res.redirect("/auth/login");
    }
    res.render("criar-senha", { user: userView(req.user) });
};

exports.alterarSenhaPage = (req, res) => {
    if (!req.user) {
        return res.redirect("/auth/login");
    }
    res.render("alterar-senha", { user: userView(req.user) });
};

function efetuarLogin(req, res, next) {
    AuthService.autenticarUsuario(
        req, res, next,
        (user) => {
            if (AuthService.usuarioBloqueado(user)) {
                return res.render("login", { error: "Usuário bloqueado. Contate o administrador.", user: userView(user) });
            }

            // Verificar se é primeiro login
            if (user.primeiroLogin) {
                return res.redirect("/auth/criar-senha");
            }

            return res.redirect("/dashboard");
        },
        (info) => {
            return res.render("login", { error: info.message, user: userView(req.user) });
        }
    );
}

exports.login = (req, res, next) => {
    const { username, password } = req.body;
    const erroPayload = AuthValidation.validarLoginPayload({ username, password });
    if (erroPayload.error) {
        return res.render("login", { error: erroPayload.error, user: userView(req.user) });
    }
    efetuarLogin(req, res, next);
};

// exports.login = passport.authenticate("local", {
//     successRedirect: "/dashboard",   // se sucesso, vai pro dashboard
//     failureRedirect: "/auth/login"   // se erro, volta pro login
// });

exports.logout = (req, res) => {
    req.logout(() => {
        res.redirect("/");
    });
};

exports.criarSenha = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect("/auth/login");
        }

        const { novaSenha, confirmarSenha } = req.body;

        // Validações
        if (!novaSenha || !confirmarSenha) {
            return res.render("criar-senha", {
                error: "Todos os campos são obrigatórios",
                user: userView(req.user)
            });
        }

        if (novaSenha !== confirmarSenha) {
            return res.render("criar-senha", {
                error: "As senhas não coincidem",
                user: userView(req.user)
            });
        }

        if (novaSenha.length < 6) {
            return res.render("criar-senha", {
                error: "A senha deve ter pelo menos 6 caracteres",
                user: userView(req.user)
            });
        }

        // Criptografar nova senha
        const senhaHash = await bcrypt.hash(novaSenha, 12);

        // Ler arquivo de usuários
        const usersPath = path.join(__dirname, '../data/users.json');
        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

        // Encontrar e atualizar o usuário
        const userIndex = usersData.findIndex(u => u.id === req.user.id);
        if (userIndex === -1) {
            return res.render("criar-senha", {
                error: "Usuário não encontrado",
                user: userView(req.user)
            });
        }

        usersData[userIndex].password = senhaHash;
        usersData[userIndex].primeiroLogin = false;

        // Salvar arquivo
        fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));

        // Atualizar sessão
        req.user.primeiroLogin = false;

        // Redirecionar para dashboard com mensagem de sucesso
        res.redirect("/dashboard");

    } catch (error) {
        console.error('Erro ao criar senha:', error);
        res.render("criar-senha", {
            error: "Erro interno do servidor",
            user: userView(req.user)
        });
    }
};

exports.alterarSenha = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect("/auth/login");
        }

        const { senhaAtual, novaSenha, confirmarSenha } = req.body;

        // Validações
        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            return res.render("alterar-senha", {
                error: "Todos os campos são obrigatórios",
                user: userView(req.user)
            });
        }

        if (novaSenha !== confirmarSenha) {
            return res.render("alterar-senha", {
                error: "As senhas não coincidem",
                user: userView(req.user)
            });
        }

        if (novaSenha.length < 6) {
            return res.render("alterar-senha", {
                error: "A senha deve ter pelo menos 6 caracteres",
                user: userView(req.user)
            });
        }

        // Verificar senha atual
        const senhaAtualCorreta = await bcrypt.compare(senhaAtual, req.user.password);
        if (!senhaAtualCorreta) {
            return res.render("alterar-senha", {
                error: "Senha atual incorreta",
                user: userView(req.user)
            });
        }

        // Criptografar nova senha
        const senhaHash = await bcrypt.hash(novaSenha, 12);

        // Ler arquivo de usuários
        const usersPath = path.join(__dirname, '../data/users.json');
        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

        // Encontrar e atualizar o usuário
        const userIndex = usersData.findIndex(u => u.id === req.user.id);
        if (userIndex === -1) {
            return res.render("alterar-senha", {
                error: "Usuário não encontrado",
                user: userView(req.user)
            });
        }

        usersData[userIndex].password = senhaHash;

        // Salvar arquivo
        fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));

        // Atualizar sessão
        req.user.password = senhaHash;

        res.render("dashboard", {
            success: "Senha alterada com sucesso!",
            user: userView(req.user)
        });

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.render("alterar-senha", {
            error: "Erro interno do servidor",
            user: userView(req.user)
        });
    }
};
