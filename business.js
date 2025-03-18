const persistence = require('./persistence');
const crypto = require("crypto"); // for hashing the MongoDB required

// Compute hash using SHA-256
async function computeHash(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Register a new user
async function registerUser(username, email, password) {  // Changed 'name' to 'username'
    if (!isValidEmail(email)) throw new Error('Invalid email format');

    const user = await persistence.findUserByEmail(email);
    if (user) throw new Error('Email already exists');

    const hashedPassword = await computeHash(password); // Hash password
   // const activationCode = crypto.randomBytes(16).toString('hex'); // Generate activation code

    //return persistence.createUser({ username, email, password: hashedPassword, activationCode, active: false }); 
    return persistence.createUser({ username, email, password: hashedPassword }) // Changed 'name' to 'username'
}

// Activate user account
/*
async function activateUser(email, activationCode) {
    return persistence.activateUser(email, activationCode);
}
*/

async function activateUser(email) {
    return persistence.activateUser(email);
}

// Login a user
async function loginUser(email, password) {
    const user = await persistence.findUserByEmail(email);
    if (!user || !user.active) throw new Error('Invalid credentials or account not activated');

    const hashedPassword = await computeHash(password);
    if (hashedPassword !== user.password) throw new Error('Invalid credentials');

    // Once logged in, create a session
    const sessionKey = crypto.randomBytes(16).toString('hex'); // Generate session key
    const sessionData = {
        sessionKey,
        user: {
            email: user.email,
            username: user.username  // Changed 'name' to 'username'
        },
    };
    await persistence.updateSession(sessionKey, sessionData); // Store session in database

    return sessionKey; // Return session key for future requests
}

// Get session data by session key
async function getSessionData(key) {
    return await persistence.getSessionData(key);
}

// Delete session by session key
async function deleteSession(key) {
    return await persistence.deleteSession(key);
}

module.exports = {
    registerUser,
    activateUser,
    loginUser,
    getSessionData,
    deleteSession
};
