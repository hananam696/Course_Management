const persistence = require('./persistence.js');

async function registerUser(name, email, password) {
    if (!name || !email || !password) {
        throw new Error('All fields are required');
    }
    return await persistence.saveUser({ name, email, password });
}

async function loginUser(email, password) {
    const user = await persistence.findUserByEmail(email);
    if (!user || user.password !== password) {
        throw new Error('Invalid credentials');
    }
    return user;
}

module.exports = { registerUser, loginUser };