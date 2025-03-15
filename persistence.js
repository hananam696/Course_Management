const { MongoClient } = require("mongodb");

let client;
const uri = "mongodb+srv://60105921:Aamna.0712@amna.aixug.mongodb.net/";


async function connectDatabase() {
    if (!client) {
        client = new MongoClient(uri);
        await client.connect();
        console.log("Database connected");
    }
    return client.db("CourseManagementSystem");
}


async function saveUser(user) {
    const db = await connectDatabase();
    await db.collection('users').insertOne(user);
    return { message: 'User registered successfully' };
}

async function findUserByEmail(email) {
    const db = await connectDatabase();
    return await db.collection('users').findOne({ email });
}


async function updateUserVerification(email) {
    const db = await connectDatabase();
    const result = await db.collection('users').updateOne(
        { email },
        { $set: { isVerified: true } }
    );
    if (result.modifiedCount > 0) {
        return { message: 'User email verified successfully' };
    }
    return { message: 'User not found' };
}
module.exports = {
    saveUser,
    findUserByEmail, 
    updateUserVerification
};


