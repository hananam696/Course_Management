const mongodb = require('mongodb')

let client = undefined
let db = undefined
let users = undefined
const uri = "mongodb+srv://60105921:Aamna.0712@amna.aixug.mongodb.net/";


async function connectDatabase() {
    if (!client) {
        client = new mongodb.MongoClient(uri);
        await client.connect();
        db = client.db('CourseManagementSystem')
        users = db.collection('user')
}
}

async function getUserDetails(username) {
  await connectDatabase()
  let db = client.db('CourseManagementSystem')
  let users = db.collection('user')
  let result = await users.find({ Username: username }).toArray()
  return result
}

 async function findUserById(id){
   await connectDatabase()
   let db = client.db('CourseManagementSystem')
   let users = db.collection('user')
   let result = await users.findOne({ id: Number(id) })
   return result
 }



 async function updateUser(uid, newUid){
   await connectDatabase()
   let db = client.db('CourseManagementSystem')
   let user = db.collection('user')
   return await user.updateOne({ 'data.UserId': uid},  {$set:{'data.UserId': newUid}})

 }

 async function registerUser(name, contactInformation, degree) {
   await connectDatabase();
   regusers = db.collection('register');
   let newUser = {
     username: name,
     contactInformation: contactInformation,
     degree: degree|| "Unknown",
     approved: false
   }
   await regusers.insertOne(newUser)
 }



 async function getAllApplications() {
   await connectDatabase();
   regusers = db.collection('register');
   let result = await regusers.find({}).toArray();
   return result
 }

 async function updateApproval(userId, approvalStatus) {
  await connectDatabase();
  let regusers = db.collection('register');
  let result = await regusers.updateOne(
      { id: userId },
      { $set: { approved: approvalStatus } }
  );
  return result;
}

//login page requiremnts
async function findUserByEmail(email) {
  await connectDatabase();
  let users = db.collection('user');
  let result = await users.findOne({ email: email }); // Find user by email
  return result;
}


module.exports = {
    getUserDetails,
    findUserById,
    updateUser,
    registerUser,
    getAllApplications,
    updateApproval,
    findUserByEmail



};
