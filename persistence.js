const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://60104758:12class34@webproject.m9qp9.mongodb.net/";
const client = new MongoClient(uri);
let db, sessionCollection;


async function connectDatabase() {
    if (!db) {
        await client.connect();
        db = client.db('course_management');
        sessionCollection = db.collection("sessions");
        console.log("Connected to MongoDB");
    }
    return db;
}

// Fetch all users details
async function getDetails() {
    await connectDatabase();
    return db.collection("users").find().toArray();
}

// Create a new user
async function createUser(userData) {
    await connectDatabase();
    const usersCollection = db.collection('users');
    userData.active = false; // User is inactive until activation
    await usersCollection.insertOne(userData);
    return userData;
}


// Find user by email
async function findUserByEmail(email) {
    await connectDatabase();
    return db.collection('users').findOne({ email });
}

// Find user by username
async function findUserByUsername(username) {
    await connectDatabase();
    return db.collection('users').findOne({ username });
}

// Activate user account
async function activateUser(username, activationCode) {
    await connectDatabase();
    const user = await db.collection('users').findOne({ username, activationCode });
    if (!user) throw new Error('Invalid activation code');
    await db.collection('users').updateOne({ username }, { $set: { active: true } });
    return user;
}

// Update user
async function updateUser(userData) {
    await connectDatabase();
    await db.collection('users').updateOne(
        { username: userData.username },
        { $set: { active: userData.active } }
    );
}

/*
// Get session data
async function getSessionData(sessionKey) {
    await connectDatabase();
    return sessionCollection.findOne({ sessionKey });
}
*/

// Get session data
async function getSessionData(sessionKey) {
    await connectDatabase();
    const session = await sessionCollection.findOne({ sessionKey });
    if (session && session.expiry > new Date()) {
        return session;
    }
    return null; // Session expired or not found
}


// Update a session
async function updateSession(sessionKey, sessionData) {
    await connectDatabase();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    sessionData.expiry = expiry;
    await sessionCollection.replaceOne({ sessionKey }, sessionData, { upsert: true });
}

// Update session username
async function updateSessionUsername(username, newUsername) {
    await connectDatabase();
    await sessionCollection.updateMany(
        { "user.username": username },
        { $set: { "user.username": newUsername } }
    );
}

// Delete a session
async function deleteSession(sessionKey) {
    await connectDatabase();
    await sessionCollection.deleteOne({ sessionKey });
}



module.exports = {
    findUserByUsername,
    createUser,
    findUserByEmail,
    activateUser,
    getDetails,
    getSessionData,
    updateSession,
    updateSessionUsername,
    deleteSession,
    updateUser
};



