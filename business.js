const persistence = require('./persistence');
const crypto = require("crypto");

// Generates a hash using sha-256 for secure password storage
async function computeHash(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Computes hash for the activation code (SHA-256)
async function computeActivationCodeHash(activationCode) {
    return crypto.createHash('sha256').update(activationCode).digest('hex');
}

// Checks if an email is in a valid format
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Registers a new user after verifying email and username uniqueness
async function registerUser(username, email, password) {
    if (!isValidEmail(email)) throw new Error('Invalid email format');

    // Check if email or username already exists
    const existingEmail = await persistence.findUserByEmail(email);
    if (existingEmail) throw new Error('Email already exists');
    const existingUser = await persistence.findUserByUsername(username);
    if (existingUser) throw new Error('Username already taken. Choose a different username.');

    // Hash the password
    const hashedPassword = await computeHash(password);

    // Generate the activation code and hash it
    const activationCode = crypto.randomBytes(16).toString('hex');
    const hashedActivationCode = await computeActivationCodeHash(activationCode);

    // Simulate sending an email with the activation code
    console.log(`Email sent to ${email} with activation code: ${activationCode}`);

    // Save user with hashed password and activation code
    return persistence.createUser({ 
        username, 
        email, 
        password: hashedPassword, 
        activationCode: hashedActivationCode, 
        active: false 
    });
}

// Activates a user account using the activation code
async function activateUser(username, activationCode) {
    // Hash the activation code provided by the user
    const hashedActivationCode = await computeActivationCodeHash(activationCode);

    // Find the user by username
    const user = await persistence.findUserByUsername(username);

    if (!user) {
        console.error(`User not found: ${username}`);
        throw new Error('User not found');
    }

    // Log the stored activation code and the provided hashed activation code for debugging
    console.log(`Stored activation code: ${user.activationCode}`);
    console.log(`Hashed activation code provided: ${hashedActivationCode}`);

    // Check if the activation code matches
    if (user.activationCode !== hashedActivationCode) {
        console.error('Activation code mismatch');
        throw new Error('Invalid activation code');
    }

    // Mark user as active if the activation code matches
    await persistence.updateUser({ username, active: true });

    // Simulate sending an email to confirm activation
    console.log(`Email sent to ${user.email}: Your account has been activated.`);

    console.log('User activated successfully');
    return user;
}

// Handles user login by verifying credentials and generating a session
async function loginUser(identifier, password) {
    let user;
    if (identifier.includes('@')) {
        // Find user by email
        user = await persistence.findUserByEmail(identifier);
    } else {
        // Find user by username
        user = await persistence.findUserByUsername(identifier);
    }

    if (!user) throw new Error('Invalid credentials');
    if (!user.active) throw new Error('Account not activated. Please verify your email.');

    // Hash the entered password and compare with the stored hashed password
    const hashedPassword = await computeHash(password);
    if (hashedPassword !== user.password) throw new Error('Invalid credentials');

    // Create a session for the logged-in user
    const sessionKey = crypto.randomBytes(16).toString('hex');
    const sessionData = {
        sessionKey,
        user: {
            email: user.email,
            username: user.username
        },
        expiry: new Date(Date.now() + 5 * 60 * 1000) // Session valid for 5 minutes
    };

    await persistence.updateSession(sessionKey, sessionData);
    return sessionKey;
}

// Retrieves session data using a session key
async function getSessionData(key) {
    return await persistence.getSessionData(key);
}

// Deletes a session using a session key
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
