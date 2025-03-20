const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://60104758:12class34@webproject.m9qp9.mongodb.net/";
const client = new MongoClient(uri);
let db, sessionCollection;

// connects to the mongodb database if not already connected
async function connectDatabase() {
    if (!db) {
        await client.connect();
        db = client.db("course_management");
        sessionCollection = db.collection("sessions");
        console.log("connected to mongodb");
    }
    return db;
}

// retrieves all user details from the database
async function getDetails() {
    await connectDatabase();
    return db.collection("users").find().toArray();
}

// creates a new user in the database with default inactive status
async function createUser(userData) {
    console.log("creating user with data:", userData);
    await connectDatabase();
    const usersCollection = db.collection("users");
    userData.active = false;
    await usersCollection.insertOne(userData);
    return userData;
}

// finds a user by their email address
async function findUserByEmail(email) {
    await connectDatabase();
    return db.collection("users").findOne({ email });
}

// activates a user account using an activation code
async function activateUser(email, activationCode) {
    await connectDatabase();
    const user = await db.collection("users").findOne({ email, activationCode });
    if (!user) throw new Error("invalid activation code");
    await db.collection("users").updateOne({ email }, { $set: { active: true } });
    return user;
}

// retrieves session data if the session is still valid
async function getSessionData(sessionKey) {
    await connectDatabase();
    const session = await sessionCollection.findOne({ sessionKey });
    if (session && session.expiry > new Date()) {
        return session;
    }
    return null;
}

// updates or creates a session with a new expiry time
async function updateSession(sessionKey, sessionData) {
    await connectDatabase();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    sessionData.expiry = expiry;
    await sessionCollection.replaceOne({ sessionKey }, sessionData, { upsert: true });
}

// updates a user's username in all active sessions
async function updateSessionUsername(username, newUsername) {
    await connectDatabase();
    await sessionCollection.updateMany(
        { "user.username": username },
        { $set: { "user.username": newUsername } }
    );
}

// deletes a session by its session key
async function deleteSession(sessionKey) {
    await connectDatabase();
    await sessionCollection.deleteOne({ sessionKey });
}

// finds a user by their username
async function findUserByUsername(username) {
    await connectDatabase();
    return db.collection("users").findOne({ username });
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
    deleteSession
};