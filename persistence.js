const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://60104758:12class34@webproject.m9qp9.mongodb.net/";
const client = new MongoClient(uri); 
let db, sessionCollection;

// MongoDB connection
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
        { "user.username": username }, 
        { $set: { "user.username": newUsername } }  
    );
}

// Delete a session
async function deleteSession(sessionKey) {
    await connectDatabase();
    await sessionCollection.deleteOne({ sessionKey });
}
// Find a user by username
/*
async function findUserByUsername(username) {
    await connectDatabase();
    return db.collection("users").findOne({ username: username });
}
*/
/*
async function findUserByUsername(username) {
    await connectDatabase();
    const hashedUsername = await computeHash(username); // Hash before searching
    return db.collection("users").findOne({ username: hashedUsername });
}
*/
async function findUserByUsername(username) {
    await connectDatabase();
    return db.collection("users").findOne({ username: username }); // ✅ No hashing needed
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
