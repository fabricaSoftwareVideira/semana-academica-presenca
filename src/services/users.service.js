// src/services/users.service.js
const path = require("path");
const { readJson, writeJson } = require("../utils/file.utils");

const DATA_FILE = path.join(__dirname, "../data/users.json");

function getAllUsers() {
    return readJson(DATA_FILE);
}

function getUserByUsername(username) {
    const users = getAllUsers();
    return users.find(u => u.username === username);
}

function getUserById(id) {
    const users = getAllUsers();
    return users.find(u => u.id === id);
}

function addUser(user) {
    const users = getAllUsers();
    users.push(user);
    writeJson(DATA_FILE, users);
    return user;
}

module.exports = {
    getAllUsers,
    getUserByUsername,
    getUserById,
    addUser
};
