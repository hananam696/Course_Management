const persistence = require('./persistence.js');


async function registerUser(user) {
    const existingUser = await persistence.findUserByEmail(user.email);
    if (existingUser) {
        return { message: 'User already exists' };
    }
    const result = await persistence.saveUser(user);
    return result;
}

async function verifyUserEmail(email) {
    const result = await persistence.updateUserVerification(email);
    return result;
}

module.exports = { registerUser, verifyUserEmail };