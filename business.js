const persistence = require('./persistence'); 
const crypto = require("crypto"); 

// Compute hash using SHA-256
async function computeHash(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Email validation 
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

async function registerUser(username, email, password) {  
    if (!isValidEmail(email)) throw new Error('Invalid email format');
    const existingEmail = await persistence.findUserByEmail(email); // Check if email already exists
    if (existingEmail) throw new Error('Email already exists');
    const existingUser = await persistence.findUserByUsername(username); // Check if username already exists
    if (existingUser) throw new Error('Username already taken. Choose a different username.');
    const hashedPassword = await computeHash(password); 
    const activationCode = crypto.randomBytes(16).toString('hex');
    return persistence.createUser({ username, email, password: hashedPassword, activationCode, active: true }); 
}

// Activate user account
async function activateUser(email, activationCode) {
    return persistence.activateUser(email, activationCode);
}

async function loginUser(identifier, password) {
    let user;
    if (identifier.includes('@')) {
        user = await persistence.findUserByEmail(identifier);
    } else {
        user = await persistence.findUserByUsername(identifier);
    }

    if (!user) throw new Error('Invalid credentials');
    if (!user.active) throw new Error('Account not activated. Please verify your email.');
    const hashedPassword = await computeHash(password);
    if (hashedPassword !== user.password) throw new Error('Invalid credentials');
    const sessionKey = crypto.randomBytes(16).toString('hex');
    const sessionData = {
        sessionKey,
        user: {
            email: user.email,
            username: user.username
        },
        expiry: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
    };
    await persistence.updateSession(sessionKey, sessionData);
    return sessionKey;
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

