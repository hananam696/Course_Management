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


//app.get('/', (req, res) => {
   // res.sendFile(path.join(__dirname, 'dist', 'register.html'));
//});

app.get('/register', async (req, res) => {
    const user = await business.registerUser(req.body);
    if (!user) {
        return res.status(400).send('User registration failed');
    }
    res.status(201).send('User registered successfully');
});

app.post('/verify', async (req, res) => {
    const result = await business.verifyUserEmail(req.body.email);
    if (!result) {
        return res.status(400).send('Email verification failed');
    }
    res.status(200).send('Email verified successfully');
});



app.listen(8000, () => console.log('Server running on port 8000'));
