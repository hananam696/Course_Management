const users = []; 

async function saveUser(user) {
    users.push(user);
    return { message: 'User registered successfully' };
}

async function findUserByEmail(email) {
    return users.find(user => user.email === email);
}

module.exports = { saveUser, findUserByEmail };
