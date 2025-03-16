const persistence = require('./persistence');
const crypto = require('crypto');

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

//DRAFTTTTTTTTTTTTTTTTTTTT
//login
// Function to hash passwords using SHA-256
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  async function verifyLogin(email, password) {
    try {
      // Step 1: Find the user by email
      const user = await persistence.findUserByEmail(email);
      if (!user) {
        throw new Error('User not found'); // User does not exist
      }

      // Step 2: Hash the provided password and compare it with the stored hash
      const hashedPassword = persistence.hashPassword(password);
      if (hashedPassword !== user.password) {
        throw new Error('Invalid password'); // Password does not match
      }

      // Step 3: Create a new object without the password
      const userWithoutPassword = {
        name: user.name,
        email: user.email,
        degree: user.degree
      };

      // Step 4: Return the user object (without the password)
      return userWithoutPassword;
    } catch (error) {
      throw error; // Propagate the error to the presentation layer
    }
  }
module.exports = { checkLogin, getUser, updateUser, findUserById, registerUser, hashPassword, verifyLogin };