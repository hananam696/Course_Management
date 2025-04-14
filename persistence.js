const { MongoClient } = require("mongodb");
//const mongodb = require('mongodb');
const { ObjectId } = require('mongodb');


const uri = "mongodb+srv://60104758:12class34@webproject.m9qp9.mongodb.net/";
const client = new MongoClient(uri);
let db, sessionCollection;

/**
 * Connects to the MongoDB database.
 * @returns {Promise<import("mongodb").Db>} The connected database instance.
 * @throws {Error} If the connection fails.
 */
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

/**
 * Retrieves all users from the database.
 * @returns {Promise<Array<Object>>} List of user documents.
 */
async function getDetails() {
    await connectDatabase();
    return db.collection("users").find().toArray();
}

/**
 * Creates a new user in the database.
 * @param {Object} userData - The user data to insert.
 * @param {string} userData.email - The user's email.
 * @param {string} userData.username - The user's username.
 * @param {string} userData.activationCode - The activation code for the user.
 * @returns {Promise<Object>} The created user document.
 */
async function createUser(userData) {
    await connectDatabase();
    const usersCollection = db.collection("users");
    userData.active = false;
    await usersCollection.insertOne(userData);
    return userData;
}

/**
 * Finds a user by email.
 * @param {string} email - The email of the user to find.
 * @returns {Promise<Object|null>} The user document or null if not found.
 */
async function findUserByEmail(email) {
    await connectDatabase();
    return db.collection("users").findOne({ email });
}

/**
 * Finds a user by username.
 * @param {string} username - The username of the user to find.
 * @returns {Promise<Object|null>} The user document or null if not found.
 */
async function findUserByUsername(username) {
    await connectDatabase();
    return db.collection("users").findOne({ username });
}

/**
 * Activates a user account.
 * @param {string} email - The user's email.
 * @param {string} activationCode - The activation code.
 * @returns {Promise<Object>} The activated user document.
 * @throws {Error} If the activation code is invalid.
 */
async function activateUser(email, activationCode) {
    await connectDatabase();
    const user = await db.collection("users").findOne({ email, activationCode });
    if (!user) throw new Error("Invalid activation code");
    await db.collection("users").updateOne({ email }, { $set: { active: true } });
    return user;
}

/**
 * Updates a user's information.
 * @param {Object} userData - The user data to update.
 * @param {string} userData.email - The user's email.
 * @param {boolean} userData.active - The user's active status.
 * @returns {Promise<void>}
 */
async function updateUser(userData) {
    await connectDatabase();
    await db.collection("users").updateOne(
        { email: userData.email },
        { $set: userData }
    );
}

/**
 * Retrieves session data based on session key.
 * @param {string} sessionKey - The session key.
 * @returns {Promise<Object|null>} The session document or null if expired or not found.
 */
async function getSessionData(sessionKey) {
    await connectDatabase();
    const session = await sessionCollection.findOne({ sessionKey });
    if (session && session.expiry > new Date()) {
        return session;
    }
    return null;
}

/**
 * Updates session data.
 * @param {string} sessionKey - The session key.
 * @param {Object} sessionData - The session data to update.
 * @returns {Promise<void>}
 */
async function updateSession(sessionKey, sessionData) {
    await connectDatabase();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    sessionData.expiry = expiry;
    await sessionCollection.replaceOne({ sessionKey }, sessionData, { upsert: true });
}

/**
 * Updates the email in all sessions where the old email exists.
 * @param {string} email - The old email.
 * @param {string} newEmail - The new email to update.
 * @returns {Promise<void>}
 */
async function updateSessionEmail(email, newEmail) {
    await connectDatabase();
    await sessionCollection.updateMany(
        { "user.email": email },
        { $set: { "user.email": newEmail } }
    );
}

/**
 * Deletes a session based on session key.
 * @param {string} sessionKey - The session key.
 * @returns {Promise<void>}
 */
async function deleteSession(sessionKey) {
    await connectDatabase();
    await sessionCollection.deleteOne({ sessionKey });
}

async function updatePassword(key, hashedPassword) {
    await connectDatabase();
    const user = await db.collection("users").findOne({ resetKey: key });

    if (!user) throw new Error("Invalid reset key");

    await db.collection("users").updateOne(
        { email: user.email },
        {
            $set: {
                password: hashedPassword,
                resetKey: null,
                resetKeyExpiry: null
            }
        }
    );
}

async function checkReset(key) {
    await connectDatabase();
    return db.collection("users").findOne({
        resetKey: decodeURIComponent(key),
        resetKeyExpiry: { $gt: Date.now() }
    });
}

async function insertRequest(request) {
    await connectDatabase();
    const requestCollection = db.collection("requests");
    await requestCollection.insertOne(request);
    return request;
}

async function getRequestsByEmail(email) {
    await connectDatabase();
    const requestCollection = db.collection("requests");
    return await requestCollection.find({ studentEmail: email }).toArray();
}

async function getPendingRequestCount() {
    await connectDatabase();
    return db.collection("requests").countDocuments({ status: "Pending" });
}

async function getRequestById(requestId) {
    await connectDatabase();
    try {
        const oid = ObjectId.isValid(requestId) ? new ObjectId(requestId) : requestId;
        return await db.collection('requests').findOne({ _id: oid });
    } catch (error) {
        console.error('Error in getRequestById:', error);
        throw new Error('Invalid request ID');
    }
}


async function updateRequest(requestId, updateData) {
    await connectDatabase();
    try {
        const id = ObjectId.isValid(requestId) ? new ObjectId(requestId) : requestId;
        await db.collection('requests').updateOne(
            { _id: id },
            { $set: updateData }
        );
        return await this.getRequestById(id);
    } catch (error) {
        console.error('Error in updateRequest:', error);
        throw new Error('Failed to update request');
    }
}

async function cancelRequest(requestId, userEmail) {
    await connectDatabase();

    // Convert to ObjectId if valid
    const oid = ObjectId.isValid(requestId) ? new ObjectId(requestId) : requestId;

    // First verify the request exists and belongs to the user
    const request = await db.collection('requests').findOne({
        _id: oid,
        studentEmail: userEmail
    });

    if (!request) {
        throw new Error('Request not found or not authorized');
    }

    if (request.status === 'Cancelled') {
        throw new Error('Request is already cancelled');
    }

    const updateData = {
        status: 'Cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date()
    };

    await db.collection('requests').updateOne(
        { _id: oid },
        { $set: updateData }
    );

    return { ...request, ...updateData };
}

async function getCancelledRequests(query) {
    await connectDatabase();
    return db.collection('requests')
             .find(query)
             .sort({ cancelledAt: -1 })
             .toArray();
}
/**
 * Updates request status with additional validation
 * @param {string} requestId - The request ID
 * @param {string} newStatus - The new status
 * @returns {Promise<Object>} The updated request
 * @throws {Error} If invalid status transition
 */
async function updateRequestStatus(requestId, newStatus) {
    await connectDatabase();

    const oid = ObjectId.isValid(requestId) ? new ObjectId(requestId) : requestId;
    const currentRequest = await db.collection('requests').findOne({ _id: oid });

    if (!currentRequest) {
        throw new Error('Request not found');
    }

    // Validate status transition
    if (currentRequest.status === 'Completed' && newStatus !== 'Completed') {
        throw new Error('Completed requests cannot be modified');
    }

    const updateData = {
        status: newStatus,
        updatedAt: new Date()
    };

    if (newStatus === 'Cancelled') {
        updateData.cancelledAt = new Date();
    } else if (newStatus === 'Completed') {
        updateData.completedAt = new Date();
    }

    await db.collection('requests').updateOne(
        { _id: oid },
        { $set: updateData }
    );

    return this.getRequestById(oid);
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
    updateUser,
    updatePassword,
    checkReset,
    insertRequest,
    getRequestsByEmail,
    getPendingRequestCount,
    getRequestById,
    updateRequestStatus,
    getCancelledRequests,
    updateRequest,
    cancelRequest
};
