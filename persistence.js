const { MongoClient } = require("mongodb");

const uri =  "mongodb+srv://60104758:12class34@webproject.m9qp9.mongodb.net/";
const client = undefined;
let db;

// Connect to MongoDB
async function connectDatabase() {
    if (!db) {
        await client.connect();
        db = client.db('course_management'); // Database name
        console.log(" Connected to MongoDB");
    }
    return db;
}

// Fetch all users (For debugging)
async function getDetails() {
    const db = await connectDatabase();
    return db.collection("users").find().toArray();
}

// Create a user (Fixing undefined 'db')
async function createUser(userData) {
    const db = await connectDatabase();
    const usersCollection = db.collection('users');
    await usersCollection.insertOne(userData);
    console.log(`Activation code for ${userData.email}: ${userData.activationCode}`);
    return userData;
}

// Find user by email
async function findUserByEmail(email) {
    const db = await connectDatabase();
    return db.collection('users').findOne({ email });
}

// Activate user account
async function activateUser(email, activationCode) {
    const db = await connectDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ email, activationCode });
    if (!user) throw new Error('Invalid activation code');

    await usersCollection.updateOne({ email }, { $set: { active: true } });
    return user;
}

module.exports = { createUser, findUserByEmail, activateUser, getDetails };

