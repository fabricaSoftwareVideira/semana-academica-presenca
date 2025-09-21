const jwt = require('../services/jwt.service');
const AlunoRepository = require('../repositories/aluno.repository');

exports.pontuacaoPage = (req, res) => {
    res.render('pontuacao', { pontuacao: null, aluno: null, error: null });
};

exports.lerPontuacao = (req, res) => {
    const { token } = req.body;
    try {
        const payload = jwt.verificarToken(token);
        const aluno = AlunoRepository.findByCodigo(payload.codigo);
        if (!aluno) {
            return res.status(400).json({ success: false, message: 'Aluno não encontrado.' });
        }
        res.json({ success: true, aluno, pontuacao: aluno.pontos || 0 });
    } catch (e) {
        res.status(400).json({ success: false, message: 'QR Code inválido.' });
    }
};
