const persistence = require('./persistence');
async function checkLogin(name, contactInformation) {
    const users = await persistence.getUserDetails(name);
    if (users.length > 0) {
        const user = users[0];  
        if (user.contactInformation === contactInformation) {
            return user.data.degree;  
        }
    }
    return undefined;  
}


async function getUser(name) {
    const users = await persistence.getUserDetails(name);
    return users.length > 0 ? users[0] : null;  // Return the first user or null if not found
}

async function updateUser(uid, newUid) {
    return await persistence.updateUser(uid, newUid);
}

async function findUserById(uid) {
    return await persistence.findUserById(uid);
}

async function registerUser(name, contactInformation, degree= "Unknown") {
    return await persistence.registerUser(name, contactInformation, degree);
}

module.exports = { checkLogin, getUser, updateUser, findUserById, registerUser };