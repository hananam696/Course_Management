const express = require('express');
const handlebars = require('express-handlebars');
const business = require('./business');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

// set up handlebars as the template engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');
app.engine('handlebars', handlebars.engine());

// middleware to parse incoming data and use cookies
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'dist')));

// render the login page when users access the root url
app.get('/', (req, res) => res.render('login', { layout: false }));

// render the registration page
app.get('/register', (req, res) => res.render('register', { layout: false }));

// render the login page (alternative route)
app.get('/login', (req, res) => res.render('login', { layout: false }));

// handle user registration
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = await business.registerUser(username, email, password);
        res.send(`user registered. check your email for activation code. code: ${user.activationCode}`);
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message);
    }
});

// handle user login and redirect based on role
app.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body; // "identifier" can be email or username
        const user = await business.loginUser(identifier, password);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message);
    }
});

// handle account activation
app.post('/activate', async (req, res) => {
    try {
        const { email, activationCode } = req.body;
        await business.activateUser(email, activationCode);
        res.send('account activated. you can now log in.');
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message);
    }
});

// start the server on port 8000
app.listen(8000, () => console.log('server running on http://localhost:8000/login'));