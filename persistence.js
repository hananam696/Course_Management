const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://60104758:12class34@webproject.m9qp9.mongodb.net/";
const client = new MongoClient(uri);
let db, sessionCollection;

// Connects to the MongoDB database if not already connected
async function connectDatabase() {
    if (!db) {
        await client.connect();
        db = client.db("course_management");
        sessionCollection = db.collection("sessions");
        console.log("Connected to MongoDB");
    }
    return db;
}

// Retrieves all user details from the database
async function getDetails() {
    await connectDatabase();
    return db.collection("users").find().toArray();
}

// Creates a new user in the database with default inactive status
async function createUser(userData) {
    await connectDatabase();
    const usersCollection = db.collection("users");
    userData.active = false; // User is inactive until activation
    await usersCollection.insertOne(userData);
    return userData;
}

// Finds a user by their email address
async function findUserByEmail(email) {
    await connectDatabase();
    return db.collection("users").findOne({ email });
}

// Finds a user by their username
async function findUserByUsername(username) {
    await connectDatabase();
    return db.collection("users").findOne({ username });
}

// Activates a user account using an activation code
async function activateUser(username, activationCode) {
    await connectDatabase();
    const user = await db.collection("users").findOne({ username, activationCode });
    if (!user) throw new Error("Invalid activation code");
    await db.collection("users").updateOne({ username }, { $set: { active: true } });
    return user;
}

// Updates user account (e.g., activation status)
async function updateUser(userData) {
    await connectDatabase();
    await db.collection("users").updateOne(
        { username: userData.username },
        { $set: { active: userData.active } }
    );
}

// Retrieves session data if the session is still valid
async function getSessionData(sessionKey) {
    await connectDatabase();
    const session = await sessionCollection.findOne({ sessionKey });
    if (session && session.expiry > new Date()) {
        return session;
    }
    return null;
}

// Updates or creates a session with a new expiry time
async function updateSession(sessionKey, sessionData) {
    await connectDatabase();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    sessionData.expiry = expiry;
    await sessionCollection.replaceOne({ sessionKey }, sessionData, { upsert: true });
}

// Updates a user's username in all active sessions
async function updateSessionUsername(username, newUsername) {
    await connectDatabase();
    await sessionCollection.updateMany(
        { "user.username": username },
        { $set: { "user.username": newUsername } }
    );
}

// Deletes a session by its session key
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
