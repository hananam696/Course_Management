const { MongoClient } = require("mongodb");


 const uri = "mongodb+srv://60105921:Aamna.0712@amna.aixug.mongodb.net/";
 let client = undefined;

 async function connectDatabase() {
     if (!client) {
         client = new MongoClient(uri);
         await client.connect();
     }
 }


async function createUser(userData) {
    const user = new User(userData);
    await user.save();
    console.log(`Activation code for ${user.email}: ${user.activationCode}`);
    return user;
}

async function findUserByEmail(email) {
    return User.findOne({ email });
}

async function activateUser(email, activationCode) {
    const user = await User.findOne({ email, activationCode });
    if (!user) throw new Error('Invalid activation code');

    user.active = true;
    await user.save();
    return user;
}

module.exports = { createUser, findUserByEmail, activateUser };
