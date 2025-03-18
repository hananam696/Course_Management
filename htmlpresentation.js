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


app.get('/', (req, res) => {
    res.render('home', { layout: false });  // Serve dynamic content using Handlebars
});


app.get('/register', (req, res) => {
    res.render('register', { layout: false });  // Dynamic content rendering
});


app.get('/login', (req, res) => {
    res.render('login', { layout: false });  // Dynamic content rendering
});

app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        await business.registerUser(name, email, password);
        res.send('User registered. Check console for activation code.');
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        await business.loginUser(email, password);
        res.send('Login successful');
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.post('/activate', async (req, res) => {
    try {
        const { email, activationCode } = req.body;
        await business.activateUser(email, activationCode);
        res.send('Account activated. You can now log in.');
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Start Server
app.listen(8000, () => console.log('Server running on http://localhost:8000'));
