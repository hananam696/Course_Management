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
