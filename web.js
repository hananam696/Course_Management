const express = require('express');
const handlebars = require('express-handlebars');
const business = require('./business');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');
app.engine('handlebars', handlebars.engine());

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/', (req, res) => {
    const sessionKey = req.cookies.sessionKey;
    if (sessionKey) {
        res.render('login', { layout: false, message: 'Login successful! Welcome back.' });
    } else {
        res.render('login', { layout: false });
    }
});

app.get('/login', (req, res) => res.render('login', { layout: false }));

app.get('/register', (req, res) => res.render('register', { layout: false }));

app.get('/activate', (req, res) => res.render('activate', { layout: false }));

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'admin.html'));
});

app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = await business.registerUser(username, email, password);
        res.send(`
            <p>User registered. Check your email for activation code.</p>
            <a href="/activate">Click here to enter your activation code</a>
        `);
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message);
    }
});
app.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const { sessionKey, isAdmin } = await business.loginUser(identifier, password);
        res.cookie('sessionKey', sessionKey, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 5 * 60 * 1000,
        });
        const redirectUrl = isAdmin ? '/admin' : '/login';
        res.send(`
            <p>Login successful! Redirecting...</p>
            <script>
                setTimeout(() => { window.location.href = "${redirectUrl}"; }, 2000); // Redirect after 2 seconds
            </script>
        `);
    } catch (err) {
        console.error(err);
        res.send(`
            <p style="color: red;">${err.message}</p>
            <a href="/login">Click here to try again</a>
           `
        )
    }
});

app.post('/activate', async (req, res) => {
    try {
        const { email, activationCode } = req.body;
        await business.activateUser(email, activationCode);

        res.send(`
            <p>Account activated. You can now log in.</p>
            <a href="/login">Click here to log in</a>
        `);
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message);
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('sessionKey');
    res.redirect('/');
});

// Start the server on port 8000
app.listen(8000, () => console.log('Server running on http://localhost:8000'));