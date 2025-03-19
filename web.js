const express = require('express');
const handlebars = require('express-handlebars');
const business = require('./business');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

// Set up Handlebars
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');
app.engine('handlebars', handlebars.engine());

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Needed for JSON body parsing
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'dist')));  // Serve static files from 'dist' folder

// Home Route
app.get('/', (req, res) => {
    res.render('login', { layout: false });  // Serve dynamic content using Handlebars
});

// Register Route
app.get('/register', (req, res) => {
    res.render('register', { layout: false });  // Dynamic content rendering
});

// Login Route
app.get('/login', (req, res) => {
    res.render('login', { layout: false });  // Dynamic content rendering
});

// Register POST
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = await business.registerUser(username, email, password);

        // Send response with activationCode
       res.send(`User registered. Check your email for activation code. Code: ${user.activationCode}`);
        

    } catch (err) {
        console.error(err);  // Log the error for debugging
        res.status(400).send(err.message);  // Send error message to the client
    }
});

// Login POST
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await business.loginUser(email, password);
        
        // Redirect to home page on successful login
        res.redirect('/');
        
        
    } catch (err) {
        console.error(err);  // Log the error for debugging
        res.status(400).send(err.message);  // Send error message to the client
    }
});


// Activation POST
app.post('/activate', async (req, res) => {
    try {
        const { email, activationCode } = req.body;
        await business.activateUser(email, activationCode);
        res.send('Account activated. You can now log in.');
    } catch (err) {
        console.error(err);  // Log the error for debugging
        res.status(400).send(err.message);  // Send error message to the client
    }
});

// Start Server
app.listen(8000, () => console.log('Server running on http://localhost:8000/login'));
