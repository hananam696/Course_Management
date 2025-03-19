const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://60104758:12class34@webproject.m9qp9.mongodb.net/";
const client = new MongoClient(uri); // ✅ Correctly initialize MongoDB client
let db, sessionCollection;

// Connect to MongoDB
async function connectDatabase() {
    if (!db) {
        await client.connect();
        db = client.db('course_management'); // Database name
        sessionCollection = db.collection("sessions"); // ✅ Define session collection globally
        console.log("Connected to MongoDB");
    }
    return db;
}

// Fetch all users (For debugging)
async function getDetails() {
    await connectDatabase();
    return db.collection("users").find().toArray();
}

// Create a user
/*
async function createUser(userData) {
    console.log('Creating user with data:', userData);
    await connectDatabase();
    const usersCollection = db.collection('users');
    await usersCollection.insertOne(userData);
    return userData;
}
    */
async function createUser(userData) {
    console.log('Creating user with data:', userData);
    await connectDatabase();
    const usersCollection = db.collection('users');

    // Ensure the user is activated upon creation
    userData.active = true;

    await usersCollection.insertOne(userData);
    return userData;
}


// Find user by email
async function findUserByEmail(email) {
    await connectDatabase();
    return db.collection('users').findOne({ email });
}

// Activate user account
async function activateUser(email, activationCode) {
    await connectDatabase();
    const user = await db.collection('users').findOne({ email, activationCode });
    if (!user) throw new Error('Invalid activation code');

    await db.collection('users').updateOne({ email }, { $set: { active: true } });
    return user;
}

// Get session data
async function getSessionData(sessionKey) {
    await connectDatabase();
    return sessionCollection.findOne({ sessionKey });
}

// Update a session
async function updateSession(sessionKey, sessionData) {
    await connectDatabase();
    await sessionCollection.replaceOne({ sessionKey }, sessionData, { upsert: true });
}


// Update session username
async function updateSessionUsername(username, newUsername) {
    await connectDatabase();
    await sessionCollection.updateMany(
        { "user.username": username },  // Updated to match your session structure
        { $set: { "user.username": newUsername } }  // Updated to match your session structure
    );
}


// Delete a session
async function deleteSession(sessionKey) {
    await connectDatabase();
    await sessionCollection.deleteOne({ sessionKey });
}

module.exports = {
    createUser,
    findUserByEmail,
    activateUser,
    getDetails,
    getSessionData,
    updateSession,
    updateSessionUsername,
    deleteSession
};
