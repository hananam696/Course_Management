const persistence = require('./persistence');
const crypto = require("crypto");

async function computeHash(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}


async function computeActivationCodeHash(activationCode) {
    return crypto.createHash('sha256').update(activationCode).digest('hex');
}


function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}


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


async function getSessionData(key) {
    return await persistence.getSessionData(key);
}


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
