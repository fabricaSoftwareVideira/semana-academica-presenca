// Helper para resposta automática em JSON ou HTML
function respond(req, res, view, data, status = 200) {
    // console.log("Query format:", req.query.format);
    // console.log("Accept header:", req.headers['accept']);

    if (req.query.format === 'json' || (req.headers['accept'] && req.headers['accept'].includes('application/json'))) {
        return res.status(status).json(data);
    }
    return res.status(status).render(view, data);
}

module.exports = respond;
