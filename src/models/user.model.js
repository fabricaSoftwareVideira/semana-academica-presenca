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

module.exports = {
    getAllUsers,
    saveUsers,
};
