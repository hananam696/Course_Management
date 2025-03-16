const persistence = require('./persistence');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Email validation function using regex
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

async function registerUser(name, email, password) {
    if (!isValidEmail(email)) throw new Error('Invalid email format');

    const user = await persistence.findUserByEmail(email);
    if (user) throw new Error('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const activationCode = uuidv4();

    return persistence.createUser({ name, email, password: hashedPassword, activationCode, active: false });
}

async function activateUser(email, activationCode) {
    return persistence.activateUser(email, activationCode);
}

async function loginUser(email, password) {
    const user = await persistence.findUserByEmail(email);
    if (!user || !user.active) throw new Error('Invalid credentials or account not activated');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    return user;
}

module.exports = { registerUser, activateUser, loginUser };
