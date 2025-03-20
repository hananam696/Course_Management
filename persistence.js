const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://60104758:12class34@webproject.m9qp9.mongodb.net/";
const client = new MongoClient(uri);
let db, sessionCollection;

async function connectDatabase() {
    try {
        await client.connect();
        db = client.db("course_management");
        sessionCollection = db.collection("sessions");
        return db;
    } catch (error) {
        throw new Error("Database connection failed: " + error.message);
    }
}


async function getDetails() {
    await connectDatabase();
    return db.collection("users").find().toArray();
}


async function createUser(userData) {
    await connectDatabase();
    const usersCollection = db.collection("users");
    userData.active = false;
    await usersCollection.insertOne(userData);
    return userData;
}

async function findUserByEmail(email) {
    await connectDatabase();
    return db.collection("users").findOne({ email });
}


async function findUserByUsername(username) {
    await connectDatabase();
    return db.collection("users").findOne({ username });
}


async function activateUser(email, activationCode) {
    await connectDatabase();
    const user = await db.collection("users").findOne({ email, activationCode });
    if (!user) throw new Error("Invalid activation code");
    await db.collection("users").updateOne({ email }, { $set: { active: true } });
    return user;
}


async function updateUser(userData) {
    await connectDatabase();
    await db.collection("users").updateOne(
        { email: userData.email },
        { $set: { active: userData.active } }
    );
}


async function getSessionData(sessionKey) {
    await connectDatabase();
    const session = await sessionCollection.findOne({ sessionKey });
    if (session && session.expiry > new Date()) {
        return session;
    }
    return null;
}


async function updateSession(sessionKey, sessionData) {
    await connectDatabase();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    sessionData.expiry = expiry;
    await sessionCollection.replaceOne({ sessionKey }, sessionData, { upsert: true });
}

async function updateSessionEmail(email, newEmail) {
    await connectDatabase();
    await sessionCollection.updateMany(
        { "user.email": email },
        { $set: { "user.email": newEmail } }
    );
}


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
    updateSessionEmail,
    deleteSession,
    updateUser
};
