const express = require('express');
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const business = require('./business.js');
const path = require('path');
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.engine('handlebars', handlebars.engine());
app.set('view engine', 'handlebars');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Routes
app.post('/register', async (req, res) => {
    try {
        const result = await business.registerUser(req.body.name, req.body.email, req.body.password);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.post('/login', async (req, res) => {
    try {
        const user = await business.loginUser(req.body.email, req.body.password);
        res.json({ message: 'Login successful', role: user.role });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'dashboard.html'));
});


app.listen(8000, () => console.log('Server running on port 8000'));

