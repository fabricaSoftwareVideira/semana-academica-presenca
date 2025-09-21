const jwt = require('../services/jwt.service');
const AlunoRepository = require('../repositories/aluno.repository');
const { userView } = require('../utils/user-view.utils');

const pontuacaoPage = (req, res) => {
    res.render('pontuacao', { pontuacao: null, aluno: null, error: null, user: userView(req.user) });
};

const lerPontuacao = (req, res) => {
    const { token } = req.body;
    try {
        const payload = jwt.verificarToken(token);
        const aluno = AlunoRepository.findByCodigo(payload.codigo);
        if (!aluno) {
            return res.status(400).json({ success: false, message: 'Aluno não encontrado.' });
        }
        res.json({ success: true, aluno, pontuacao: aluno.pontos || 0 });
    } catch (e) {
        console.log(e);

        res.status(400).json({ success: false, message: 'QR Code inválido.', user: userView(req.user) });
    }
};

module.exports = { pontuacaoPage, lerPontuacao };
