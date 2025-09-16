// Funções utilitárias para checagem de roles
function getRole(user) {
    return user && typeof user.role === 'string' ? user.role.trim().toLowerCase() : '';
}

function isAdmin(user) {
    return getRole(user) === 'admin';
}

function isOrganizador(user) {
    return getRole(user) === 'organizador';
}

function isConvidado(user) {
    return getRole(user) === 'convidado';
}

function isAnyRole(user, roles) {
    const role = getRole(user);
    return Array.isArray(roles) && roles.map(r => r.toLowerCase()).includes(role);
}

module.exports = { isAdmin, isOrganizador, isConvidado, isAnyRole, getRole };
