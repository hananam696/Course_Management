const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    activationCode: String,
    active: Boolean
});

const User = mongoose.model('User', UserSchema);

async function createUser(userData) {
    const user = new User(userData);
    await user.save();
    console.log(`Activation code for ${user.email}: ${user.activationCode}`);
    return user;
}

async function findUserByEmail(email) {
    return User.findOne({ email });
}

async function activateUser(email, activationCode) {
    const user = await User.findOne({ email, activationCode });
    if (!user) throw new Error('Invalid activation code');

    user.active = true;
    await user.save();
    return user;
}

module.exports = { createUser, findUserByEmail, activateUser };
