const persistence = require('./persistence');
const crypto = require("crypto"); // for hashing the mongodb required
// used crypto insteaad of bcrypt
// got the cryto and compute hash from our lecture code


// async function computeHash(password) {
//     let hash = crypto.createHash('sha256'); // Use SHA-256 hashing
//     hash.update(password);
//     let res = hash.digest('hex');
//     return res;
// }

async function computeHash(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// TESTING THIS CODEWITHOUT USING NEW MODULE LIKE UUID
 function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

async function registerUser(name, email, password) {
    if (!isValidEmail(email)) throw new Error('Invalid email format');

    const user = await persistence.findUserByEmail(email);
    if (user) throw new Error('Email already exists');

    const hashedPassword = await computeHash(password); // Hash password
    const activationCode = crypto.randomBytes(16).toString('hex');

    return persistence.createUser({ name, email, password: hashedPassword, activationCode, active: false });
}

async function activateUser(email, activationCode) {
    return persistence.activateUser(email, activationCode);
}

//UNCOMMENTED JUST FOR TESTING
// const { v4: uuidv4 } = require('uuid');

//  // Email validation function using regex
//  function isValidEmail(email) {
//      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//      return emailRegex.test(email);
//  }

async function checkLogin(username, password) {
    let details = await persistence.getUserDetails(username)

    if (details && details.Username === username && details.Password === password) {
        return details.AccountType
    }
    return undefined
}



// async function registerUser(name, email, password) {
//     if (!isValidEmail(email)) throw new Error('Invalid email format');

//     const user = await persistence.findUserByEmail(email);
//     if (user) throw new Error('Email already exists');

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const activationCode = uuidv4();

//     return persistence.createUser({ name, email, password: hashedPassword, activationCode, active: false });
// }

// async function activateUser(email, activationCode) {
//     return persistence.activateUser(email, activationCode);
// }

async function loginUser(email, password) {
    const user = await persistence.findUserByEmail(email);
    if (!user || !user.active) throw new Error('Invalid credentials or account not activated');

    const hashedPassword = await computeHash(password);
    if (hashedPassword !== user.password) throw new Error('Invalid credentials');

    return user;
}
module.exports = { registerUser, activateUser, loginUser };



