const express = require('express');
const handlebars = require('express-handlebars');
const business = require('./business');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

// Set up Handlebars as the template engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');
app.engine('handlebars', handlebars.engine());

// Middleware to parse incoming data and use cookies
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'dist')));

// Render the login page when users access the root URL
app.get('/', (req, res) => res.render('login', { layout: false }));

// Render the registration page
app.get('/register', (req, res) => res.render('register', { layout: false }));

// Render the activation page
app.get('/activate', (req, res) => res.render('activate', { layout: false }));

// Handle user registration
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = await business.registerUser(username, email, password);

        // Provide activation instructions
        res.send(`
            <p>User registered. Check your email for activation code.</p>
            <a href="/activate">Click here to enter your activation code</a>
        `);
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message);
    }
});

// Admin homepage route
app.get('/admin', (req, res) => {
    res.render('admin', { layout: false }); // Render the admin.handlebars template
});

app.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body; // "identifier" can be email or username
        const { sessionKey, isAdmin } = await business.loginUser(identifier, password);

        // Set the session key as a cookie
        res.cookie('sessionKey', sessionKey, { httpOnly: true });

        // Determine the redirect URL based on whether the user is an admin
        const redirectUrl = isAdmin ? '/admin' : '/';

        // Send a response with a redirect message and JavaScript-based redirection
        res.send(`
            <p>Login successful! Redirecting...</p>
            <script>
                setTimeout(() => { window.location.href = "${redirectUrl}"; }, 2000); // Redirect after 2 seconds
            </script>
        `);
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message);
    }
});
// Handle account activation
app.post('/activate', async (req, res) => {
    try {
        const { username, activationCode } = req.body;
        await business.activateUser(username, activationCode);
        res.send('Account activated. You can now log in.');
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message);
    }
});

// Start the server on port 8000
app.listen(8000, () => console.log('Server running on http://localhost:8000'));
