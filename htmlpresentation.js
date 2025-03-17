
const express = require('express');
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const business = require('./business');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'dist')));

// Handlebars setup
app.engine('handlebars', handlebars.engine());
app.set('view engine', 'handlebars');

// Serve the registration page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'register.html'));
});

// Handle registration form submission
app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        await business.registerUser(name, email, password);
        res.status(201).json({ message: 'User registered. Check console for activation code.' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Serve the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'login.html'));
});

// Handle login form submission
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        await business.loginUser(email, password);
        res.status(200).json({ message: 'Login successful' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Handle account activation
app.post('/activate', async (req, res) => {
    try {
        const { email, activationCode } = req.body;
        await business.activateUser(email, activationCode);
        res.status(200).json({ message: 'Account activated. You can now log in.' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Start the server
app.listen(8000, () => console.log('Server running on port 8000'));