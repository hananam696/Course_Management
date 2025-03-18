//SHIFT TO HTMLPRESENTATION.JS

// const express = require('express');
// const router = express.Router();
// const business = require('./business');

// const app = express();
// router.post('/register', async (req, res) => {
//     try {
//         const { name, email, password } = req.body;
//         await business.registerUser(name, email, password);
//         res.status(201).json({ message: 'User registered. Check console for activation code.' });
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// });

// ///testing
// router.post('/activate', async (req, res) => {
//     try {
//         const { email, activationCode } = req.body;
//         await business.activateUser(email, activationCode);
//         res.status(200).json({ message: 'Account activated. You can now log in.' });
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// });

// router.post('/login', async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         await business.loginUser(email, password);
//         res.status(200).json({ message: 'Login successful' });
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// });

// module.exports = router;
