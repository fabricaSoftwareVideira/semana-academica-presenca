
const UserModel = require('../models/user.model');

const UserRepository = {
    getAll: () => UserModel.getAllUsers(),
    saveAll: (users) => UserModel.saveUsers(users),
    findByUsername: (username) => {
        const users = UserModel.getAllUsers();
        return users.find(u => u.username === username);
    }
};

module.exports = UserRepository;
