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

// Register a new user
/*
async function registerUser(username, email, password) {  
    if (!isValidEmail(email)) throw new Error('Invalid email format');
    
    const user = await persistence.findUserByEmail(email);
    if (user) throw new Error('Email already exists');

    const hashedPassword = await computeHash(password); // Hash password
    const activationCode = crypto.randomBytes(16).toString('hex'); // Generate activation code

    // Ensure users are activated by default
    return persistence.createUser({ username, email, password: hashedPassword, activationCode, active: true }); 
}
    */
   // Register a new user
  /* 
async function registerUser(username, email, password) {  
    if (!isValidEmail(email)) throw new Error('Invalid email format');

    // Check if email already exists
    const existingEmail = await persistence.findUserByEmail(email);
    if (existingEmail) throw new Error('Email already exists');

    // Check if username already exists
    const existingUser = await persistence.findUserByUsername(username);
    if (existingUser) throw new Error('Username already taken. Choose a different username.');

    const hashedPassword = await computeHash(password); // Hash password
    const activationCode = crypto.randomBytes(16).toString('hex'); // Generate activation code

    // Ensure users are activated by default
    return persistence.createUser({ username, email, password: hashedPassword, activationCode, active: true }); 
}


 */
async function registerUser(username, email, password) {  
    if (!isValidEmail(email)) throw new Error('Invalid email format');

    // Check if email already exists
    const existingEmail = await persistence.findUserByEmail(email);
    if (existingEmail) throw new Error('Email already exists');

    // Check if username already exists
    const existingUser = await persistence.findUserByUsername(username);
    if (existingUser) throw new Error('Username already taken. Choose a different username.');

    const hashedPassword = await computeHash(password); // ✅ Only hash password
    const activationCode = crypto.randomBytes(16).toString('hex'); // Generate activation code

    return persistence.createUser({ username, email, password: hashedPassword, activationCode, active: true }); 
}


// Activate user account
async function activateUser(email, activationCode) {
    return persistence.activateUser(email, activationCode);
}

// Login a user
/*
async function loginUser(email, password) {
    const user = await persistence.findUserByEmail(email);
    
    if (!user) throw new Error('Invalid credentials');
    if (!user.active) throw new Error('Account not activated. Please verify your email.');

    const hashedPassword = await computeHash(password);
    if (hashedPassword !== user.password) throw new Error('Invalid credentials');

    // Once logged in, create a session
    const sessionKey = crypto.randomBytes(16).toString('hex'); // Generate session key
    const sessionData = {
        sessionKey,
        user: {
            email: user.email,
            username: user.username  
        },
    };
    await persistence.updateSession(sessionKey, sessionData); // Store session in database
    return sessionKey; 
}
*/
/*
async function loginUser(email, username, password) {
    // Hash the entered username
    const hashedUsername = await computeHash(username);

    // Find user by hashed username and email
    const user = await persistence.findUserByUsername(hashedUsername);
    
    if (!user || user.email !== email) throw new Error('Invalid credentials');
    if (!user.active) throw new Error('Account not activated. Please verify your email.');

    // Hash and check the password
    const hashedPassword = await computeHash(password);
    if (hashedPassword !== user.password) throw new Error('Invalid credentials');

    // Generate session key
    const sessionKey = crypto.randomBytes(16).toString('hex'); 
    const sessionData = {
        sessionKey,
        user: {
            email: user.email,
            username: user.username // This will be the hashed version
        },
    };
    await persistence.updateSession(sessionKey, sessionData);

    return sessionKey; 
}
    */
   /*
async function loginUser(identifier, password) {
    let user;

    // Check if input is an email (contains '@')
    if (identifier.includes('@')) {
        user = await persistence.findUserByEmail(identifier);
    } else {
        const hashedUsername = await computeHash(identifier); // Hash username before searching
        user = await persistence.findUserByUsername(hashedUsername);
    }

    if (!user) throw new Error('Invalid credentials');
    if (!user.active) throw new Error('Account not activated. Please verify your email.');

    // Hash and check the password
    const hashedPassword = await computeHash(password);
    if (hashedPassword !== user.password) throw new Error('Invalid credentials');

    // Generate session key
    const sessionKey = crypto.randomBytes(16).toString('hex'); 
    const sessionData = {
        sessionKey,
        user: {
            email: user.email,
            username: user.username  
        },
    };
    await persistence.updateSession(sessionKey, sessionData);

    return sessionKey; 
}

*/
async function loginUser(identifier, password) {
    let user;

    // Check if input is an email
    if (identifier.includes('@')) {
        user = await persistence.findUserByEmail(identifier);
    } else {
        user = await persistence.findUserByUsername(identifier); // ✅ No hashing needed
    }

    if (!user) throw new Error('Invalid credentials');
    if (!user.active) throw new Error('Account not activated. Please verify your email.');

    // Hash and check the password
    const hashedPassword = await computeHash(password);
    if (hashedPassword !== user.password) throw new Error('Invalid credentials');

    // Generate session key
    const sessionKey = crypto.randomBytes(16).toString('hex'); 
    const sessionData = {
        sessionKey,
        user: {
            email: user.email,
            username: user.username  
        },
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
