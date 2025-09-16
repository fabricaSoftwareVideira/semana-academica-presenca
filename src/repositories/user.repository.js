
const UserModel = require('../models/user.model');

const UserRepository = {
    getAll: () => UserModel.getAllUsers(),
    saveAll: (users) => UserModel.saveUsers(users),
    findByUsername: (username) => {
        const users = UserModel.getAllUsers();
        return users.find(u => u.username === username);
    },
    getNextId: function () {
        const users = this.getAll();
        if (users.length === 0) return 1;
        return Math.max(...users.map(u => u.id)) + 1;
    }
};

module.exports = UserRepository;
