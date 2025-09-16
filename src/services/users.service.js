const UserRepository = require("../repositories/user.repository.js");

function getAllUsers() {
    return UserRepository.getAll();
}

function getUserByUsername(username) {
    return UserRepository.findByUsername(username);
}

function getUserById(id) {
    const users = UserRepository.getAll();
    return users.find(u => u.id === id);
}

function addUser(user) {
    const users = UserRepository.getAll();
    users.push(user);
    UserRepository.saveAll(users);
    return user;
}

module.exports = {
    getAllUsers,
    getUserByUsername,
    getUserById,
    addUser
};
