const { MongoClient } = require("mongodb");



 //const uri = "mongodb+srv://60105921:Aamna.0712@amna.aixug.mongodb.net/";
 const uri = "mongodb+srv://60104758:12class34@webproject.m9qp9.mongodb.net/";
 let client = undefined;
 let db = undefined;


 async function connectDatabase() {
    if (!client) {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db('course_management'); // Replace with your database name
    }
}

async function createUser(userData) {
    await connectDatabase();
    const usersCollection = db.collection('users'); // amna cant view your mongodb please fix the collection name with the one used just fixed few of your codes
    await usersCollection.insertOne(userData);
    console.log(`Activation code for ${userData.email}: ${userData.activationCode}`);
    return userData;
}

// async function createUser(userData) {
//     const user = new User(userData);
//     await user.save();
//     console.log(`Activation code for ${user.email}: ${user.activationCode}`);
//     return user;
// }

async function findUserByEmail(email) {
    await connectDatabase();
    const usersCollection = db.collection('users'); // fix collection name
    return usersCollection.findOne({ email });
}

// async function findUserByEmail(email) {
//     return User.findOne({ email }); // find one not allowed in this project
// }

async function activateUser(email, activationCode) {
    await connectDatabase();
    const usersCollection = db.collection('users'); // fix collecton name
    const user = await usersCollection.findOne({ email, activationCode });
    if (!user) throw new Error('Invalid activation code');

    await usersCollection.updateOne({ email }, { $set: { active: true } });
    return user;
}

// async function activateUser(email, activationCode) {
//     const user = await User.findOne({ email, activationCode });
//     if (!user) throw new Error('Invalid activation code');

//     user.active = true;
//     await user.save();
//     return user;
// }

module.exports = { createUser, findUserByEmail, activateUser };
