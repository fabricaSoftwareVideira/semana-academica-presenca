const UserModel = require('../models/user.model');

const UserRepository = {
    getAll: () => UserModel.getAllUsers(),
    saveAll: (users) => UserModel.saveUsers(users),
};

module.exports = UserRepository;
