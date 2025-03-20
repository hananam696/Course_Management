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

// Root route (login page)
app.get('/', (req, res) => {
    const sessionKey = req.cookies.sessionKey;
    if (sessionKey) {
        // User is logged in, display a success message
        res.render('login', { layout: false, message: 'Login successful! Welcome back.' });
    } else {
        // User is not logged in, display the regular login page
        res.render('login', { layout: false });
    }
});

app.get('/login', (req, res) => res.render('login', { layout: false }));
// Render the registration page
app.get('/register', (req, res) => res.render('register', { layout: false }));

// Render the activation page
app.get('/activate', (req, res) => res.render('activate', { layout: false }));


app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'admin.html'));
});

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
app.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const { sessionKey, isAdmin } = await business.loginUser(identifier, password);

        console.log('isAdmin:', isAdmin); // Debugging: Check the value of isAdmin

        // Set the session key as a cookie
        res.cookie('sessionKey', sessionKey, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 5 * 60 * 1000,
        });

        // Determine the redirect URL based on whether the user is an admin
        const redirectUrl = isAdmin ? '/admin' : '/login';

        // Send a response with a redirect message and JavaScript-based redirection
        res.send(`
            <p>Login successful! Redirecting...</p>
            <script>
                setTimeout(() => { window.location.href = "${redirectUrl}"; }, 2000); // Redirect after 2 seconds
            </script>
        `);
    } catch (err) {
        console.error(err);

        // Redirect back to the login page with an error message
        res.send(`
            <p style="color: red;">${err.message}</p>
            <a href="/login">Click here to try again</a>
           `
        )
    }
});

app.post('/activate', async (req, res) => {
    try {
        const { email, activationCode } = req.body; // Use email instead of username
        await business.activateUser(email, activationCode);

        // Send an HTML response with a login link
        res.send(`
            <p>Account activated. You can now log in.</p>
            <a href="/login">Click here to log in</a>
        `);
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message);
    }
});

// Logout route
app.get('/logout', (req, res) => {
    // Clear the session cookie
    res.clearCookie('sessionKey');
    res.redirect('/'); // Redirect to the login page
});

// Start the server on port 8000
app.listen(8000, () => console.log('Server running on http://localhost:8000'));