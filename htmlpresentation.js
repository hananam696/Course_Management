const express = require('express');
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const business = require('./business.js');
const path = require('path');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'dist')));
app.engine('handlebars', handlebars.engine());
app.set('view engine', 'handlebars');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'register.html'));
});

// Serve the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'login.html'));
});

// Handle login form submission
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Step 1: Verify the login credentials
        const user = await business.verifyLogin(email, password);

        // Step 2: If valid, redirect to the dashboard or home page
        res.status(200).send('Login successful! Welcome, ' + user.name);
    } catch (error) {
        // Step 3: If invalid, show an error message
        res.status(400).send(error.message);
    }
});


app.get('/register', async (req, res) => {
    const user = await business.registerUser(req.body);
    if (!user) {
        return res.status(404).send('User registration failed');
    }
    res.status(404).send('User registered successfully');
});

app.post('/register', async (req, res) => {
    const result = await business.updateApproval(req.body.contactInformation);
    if (!result) {
        return res.status(404).send('Contact information verification failed');
    }
    res.status(404).send('Contact information verified successfully');
});



app.listen(8000, () => console.log('Server running on port 8000'));
