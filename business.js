const persistence = require('./persistence');
const crypto = require("crypto");

/**
 * Computes a SHA-256 hash of a given password.
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} - The hashed password.
 */
async function computeHash(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Computes a SHA-256 hash of a given activation code.
 * @param {string} activationCode - The activation code to hash.
 * @returns {Promise<string>} - The hashed activation code.
 */
async function computeActivationCodeHash(activationCode) {
    return crypto.createHash('sha256').update(activationCode).digest('hex');
}

/**
 * Validates if the provided email follows a valid format.
 * @param {string} email - The email to validate.
 * @returns {boolean} - True if valid, otherwise false.
 */
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

/**
 * Registers a new user by checking username/email availability, hashing the password, and storing the user data.
 * @param {string} username - The username of the new user.
 * @param {string} email - The email of the new user.
 * @param {string} password - The password of the new user.
 * @throws {Error} - If the email format is invalid, email/username already exists.
 * @returns {Promise<Object>} - The created user object.
 */
async function registerUser(username, email, password) {
    if (!isValidEmail(email)) throw new Error('Invalid email format');

    const existingEmail = await persistence.findUserByEmail(email);
    if (existingEmail) throw new Error('Email already exists');
    const existingUser = await persistence.findUserByUsername(username);
    if (existingUser) throw new Error('Username already taken. Choose a different username.');

    const hashedPassword = await computeHash(password);

    const activationCode = crypto.randomBytes(16).toString('hex');
    const hashedActivationCode = await computeActivationCodeHash(activationCode);


    console.log(`Email sent to ${email} with activation code: ${activationCode}`);


    return persistence.createUser({
        username,
        email,
        password: hashedPassword,
        activationCode: hashedActivationCode,
        active: false
    });
}

/**
 * Activates a user account by verifying the activation code.
 * @param {string} email - The email of the user to activate.
 * @param {string} activationCode - The activation code provided by the user.
 * @throws {Error} - If the user does not exist or the activation code is invalid.
 * @returns {Promise<Object>} - The activated user object.
 */
async function activateUser(email, activationCode) {
    const hashedActivationCode = await computeActivationCodeHash(activationCode);
    const user = await persistence.findUserByEmail(email);

    if (!user) {
        console.error(`User not found: ${email}`);
        throw new Error('User not found: Enter correct Email Address and Activation code');
    }
    if (user.activationCode !== hashedActivationCode) {
        console.error('Activation code mismatch');
        throw new Error('Invalid activation code');
    }

    await persistence.updateUser({ email, active: true });
    return user;
}

/**
 * Logs in a user by verifying credentials and creates a session.
 * @param {string} identifier - The username or email of the user.
 * @param {string} password - The user's password.
 * @throws {Error} - If the credentials are invalid or the account is not activated.
 * @returns {Promise<{sessionKey: string, isAdmin: boolean}>} - The session key and admin status.
 */
const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL = "admin@udst.com";

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

    const isAdmin = user.username === ADMIN_USERNAME || user.email === ADMIN_EMAIL;

    const sessionKey = crypto.randomBytes(16).toString('hex');
    const sessionData = {
        sessionKey,
        user: {
            email: user.email,
            username: user.username,
            isAdmin: isAdmin
        },
        expiry: new Date(Date.now() + 5 * 60 * 1000)
    };

    await persistence.updateSession(sessionKey, sessionData);

    return {
        sessionKey,
        isAdmin,
    };
}

/**
 * Retrieves session data for a given session key.
 * @param {string} key - The session key.
 * @returns {Promise<Object|null>} - The session data or null if expired/not found.
 */
async function getSessionData(key) {
    return await persistence.getSessionData(key);
}

/**
 * Deletes a session associated with a given session key.
 * @param {string} key - The session key.
 * @returns {Promise<void>}
 */
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
