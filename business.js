const persistence = require('./persistence'); 
const crypto = require("crypto"); 

// generates a hash using sha-256 for secure password storage
async function computeHash(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// checks if an email is in a valid format
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// registers a new user after verifying email and username uniqueness
async function registerUser(username, email, password) {  
    if (!isValidEmail(email)) throw new Error('invalid email format');
    const existingEmail = await persistence.findUserByEmail(email);
    if (existingEmail) throw new Error('email already exists');
    const existingUser = await persistence.findUserByUsername(username);
    if (existingUser) throw new Error('username already taken. choose a different one.');
    const hashedPassword = await computeHash(password);
    const activationCode = crypto.randomBytes(16).toString('hex');
    return persistence.createUser({ username, email, password: hashedPassword, activationCode, active: true });
}

// activates a user account using the activation code
async function activateUser(email, activationCode) {
    return persistence.activateUser(email, activationCode);
}

// handles user login by verifying credentials and generating a session
async function loginUser(identifier, password) {
    let user;
    if (identifier.includes('@')) {
        user = await persistence.findUserByEmail(identifier);
    } else {
        user = await persistence.findUserByUsername(identifier);
    }

    if (!user) throw new Error('invalid credentials');
    if (!user.active) throw new Error('account not activated. please verify your email.');
    const hashedPassword = await computeHash(password);
    if (hashedPassword !== user.password) throw new Error('invalid credentials');
    
    const sessionKey = crypto.randomBytes(16).toString('hex');
    const sessionData = {
        sessionKey,
        user: {
            email: user.email,
            username: user.username
        },
        expiry: new Date(Date.now() + 5 * 60 * 1000) // session valid for 5 minutes
    };
    
    await persistence.updateSession(sessionKey, sessionData);
    return sessionKey;
}

// retrieves session data using a session key
async function getSessionData(key) {
    return await persistence.getSessionData(key);
}

// deletes a session using a session key
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