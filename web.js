/**
 * Express application setup.
 */
const express = require('express');
const handlebars = require('express-handlebars');
const business = require('./business');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

// Configure view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');
app.engine('handlebars', handlebars.engine());

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'dist')));

/**
 * Renders the login page, displaying a message if the user has a session cookie.
 * @route GET /
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
app.get('/', (req, res) => {
    const sessionKey = req.cookies.sessionKey;
    if (sessionKey) {
        res.render('login', { layout: false, message: 'Login successful! Welcome back.' });
    } else {
        res.render('login', { layout: false });
    }
});

/**
 * Renders the login page.
 * @route GET /login
 */
app.get('/login', (req, res) => res.render('login', { layout: false }));

/**
 * Renders the registration page.
 * @route GET /register
 */
app.get('/register', (req, res) => res.render('register', { layout: false }));

/**
 * Renders the activation page.
 * @route GET /activate
 */
app.get('/activate', (req, res) => res.render('activate', { layout: false }));

/**
 * Serves the admin panel.
 * @route GET /admin
 */
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'admin.html'));
});

/**
 * Handles user registration with new fields
 * @route POST /register
 */
app.post('/register', async (req, res) => {
    try {
        const { username, email, password, degreeProgram } = req.body;

        const userData = {
            username,
            email,
            password,
            degreeProgram: degreeProgram || null,
            accountType: "Student"
        };

        const user = await business.registerUser(userData);
        res.send(`
            <p>User registered. Check your email for activation code.</p>
            <a href="/activate">Click here to enter your activation code</a>
        `);
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message);
    }
});

/**
 * Handles user login.
 * @route POST /login
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
// app.post('/login', async (req, res) => {
//     try {
//         const { identifier, password } = req.body;
//         const { sessionKey, isAdmin } = await business.loginUser(identifier, password);
//         res.cookie('sessionKey', sessionKey, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production',
//             maxAge: 5 * 60 * 1000,
//         });
//         const redirectUrl = isAdmin ? '/admin' : '/login';
//         res.send(`
//             <p>Login successful! Redirecting...</p>
//             <script>
//                 setTimeout(() => { window.location.href = "${redirectUrl}"; }, 1500);
//             </script>
//         `);
//     } catch (err) {
//         console.error(err);
//         res.send(`
//             <p style="color: red;">${err.message}</p>
//             <a href="/login">Click here to try again</a>
//            `
//         )
//     }
// });

app.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const { sessionKey, isAdmin } = await business.loginUser(identifier, password);

        // Set session cookie
        res.cookie('sessionKey', sessionKey, {
            httpOnly: true, // For security, cookie can only be accessed by the server
            secure: process.env.NODE_ENV === 'production', // Only in production (for HTTPS)
            maxAge: 5 * 60 * 1000, // Cookie expires after 5 minutes
        });

        // Redirect to the appropriate page based on user role
        const redirectUrl = isAdmin ? '/admin' : '/request';
        res.redirect(redirectUrl);  // Perform the actual redirect
    } catch (err) {
        console.error(err);
        res.send(`
            <p style="color: red;">${err.message}</p>
            <a href="/login">Click here to try again</a>
        `);
    }
});


/**
 * Handles user account activation.
 * @route POST /activate
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
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

app.get('/request', (req, res) => {
    res.render('request', { layout: false });
});


app.get('/logout', (req, res) => {
    res.clearCookie('sessionKey');
    res.redirect('/');
});


app.get('/forgot-password', (req, res) => {
    res.render('password_reset')
})

app.post('/forgot-password', async (req, res) => {
   await business.resetPassword(req.body.email)
    res.send("Check your email for a password reset link.")
})

app.get('/reset-password', async (req, res) => {
    let checkReset = business.checkReset(req.query.key)
    if (!checkReset) {
        res.send("Invalid key")
        return
    }
    res.render("new_password", {
        key: req.query.key
    })
})

app.post('/reset-password', async (req, res) => {
    let pw = req.body.password
    let confirm = req.body.confirm
    let key = req.body.key
    if (pw != confirm) {
        res.send("Password mismatch")
        return
    }
    await business.setPassword(key, pw)
    res.redirect('/?message=Password changed')
})



// Start the server on port 8000
app.listen(8000, () => console.log('Server running on http://localhost:8000'));