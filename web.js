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
        const { username, email, password, degreeProgram, repeatPassword } = req.body;

        const userData = {
            username,
            email,
            password,
            repeatPassword,
            degreeProgram: degreeProgram || null,
            accountType: "Student"
        };

        const user = await business.registerUser(userData);
        res.send(`
            <div style="padding: 20px; font-family: Arial, sans-serif;">
                <p style="color: green; font-size: 18px;">
                    Registration successful! Please check ${email} for activation code.
                </p>
                <p>
                    <a href="/activate" style="color: blue; text-decoration: none;">
                        ➡️ Go to Activation Page
                    </a>
                </p>
            </div>
        `);
    } catch (err) {
        console.error('Registration error:', err);
        res.status(400).send(`
            <div style="padding: 20px; font-family: Arial, sans-serif;">
                <p style="color: red; font-size: 18px;"> Error: ${err.message}</p>
                <p>
                    <a href="/register" style="color: blue; text-decoration: none;">
                        ← Return to Registration
                    </a>
                </p>
            </div>
        `);
    }
});


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
    res.render('password-reset')
})

app.post('/forgot-password', async (req, res) => {
    await business.resetPassword(req.body.email);
    res.send(`
        <div style="padding: 20px; font-family: Arial, sans-serif; text-align: center;">
            <h3 style="color: green;">Reset instructions sent!</h3>
            <p>Check your email for the activation link</p>
            <p>or</p>
            <a href="/activate-password" class="btn btn-secondary">
                Enter Reset Key Manually
            </a>
            <div class="mt-3">
                <a href="/login">Back to Login</a>
            </div>
        </div>
    `);
});

app.get('/reset-password', async (req, res) => {
    const key = req.query.key;
    const isValid = await business.checkReset(key);

    if (!isValid) {
        return res.status(400).send(`
            <div style="padding: 20px; font-family: Arial, sans-serif;">
                <p style="color: red;">Invalid or expired reset link</p>
                <a href="/forgot-password">Try again</a>
            </div>
        `);
    }

    res.render('new-password', {
        layout: false,
        key: key
    });
});

app.post('/reset-password', async (req, res) => {
    try {
        const { password, confirm, key } = req.body;

        if (password !== confirm) {
            return res.status(400).render('new-password', {
                layout: false,
                key: key,
                error: 'Passwords do not match'
            });
        }
        await business.setPassword(key, password);
        res.render('reset-success', { layout: false });
    } catch (err) {
        res.status(400).render('new-password', {
            layout: false,
            key: req.body.key,
            error: err.message
        });
    }
});

app.get('/activate-password', async (req, res) => {
    try {
        const key = req.query.key;
        if (key) {
            const isValid = await business.checkReset(key);
            if (!isValid) throw new Error('Invalid or expired reset key');
            return res.redirect(`/reset-password?key=${key}`);
        }
        res.render('reset-key', { layout: false });
    } catch (err) {
        res.render('reset-key', {
            layout: false,
            error: err.message
        });
    }
});

app.post('/activate-password', async (req, res) => {
    try {
        const { key } = req.body;
        const isValid = await business.checkReset(key);
        if (!isValid) throw new Error('Invalid or expired reset key');
        res.redirect(`/reset-password?key=${key}`);
    } catch (err) {
        res.render('reset-key', {
            layout: false,
            error: err.message
        });
    }
});

app.post('/request', async (req, res) => {
    try {
        const sessionKey = req.cookies.sessionKey;
        const session = await business.getSessionData(sessionKey);

        if (!session || !session.user) {
            return res.redirect('/login');
        }

        const { category, description, email, semester} = req.body;

        if (email !== session.user.email) {
            return res.send(
                `
            <p style="color: red;">Invalid Email: Your Email Must match the one with your account8</p>
            <a href="/request">Click here to try again</a>`
            );
        }
        const pendingCount = await business.getPendingRequestCount();
        const estimatedTime = await business.calculateEstimatedTime(pendingCount + 1);

        const requestData = {
            studentEmail: session.user.email,
            studentName: session.user.username,
            category,
            description,
            status: 'Pending',
            semester,
            createdAt : Date.now(),
            estimatedTime
        };

        await business.createRequest(requestData);
        res.send(`
            <html>
                <body>
                    <p style="
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        font-size: 24px;
                        color: green;
                    ">Request submitted successfully! Confirmation sent to ${session.user.email}</p>
                    <script>
                        setTimeout(() => {
                            window.location.href = '/request';
                        }, 2000);
                    </script>
                </body>
            </html>
        `);

    } catch (error) {
        console.error('Error creating request:', error);
        res.redirect('/request?error=Failed to submit request');
    }
});

// app.get('/student/requests', async (req, res) => {
//     try {
//         const sessionKey = req.cookies.sessionKey;
//         const session = await business.getSessionData(sessionKey);

//         if (!session || !session.user) {
//             return res.redirect('/login');
//         }

//         // Add debug logging
//         console.log("Fetching requests for:", session.user.email);
//         const userRequests = await business.getUserRequests(session.user.email);
//         console.log("Retrieved requests:", userRequests); // Check what data you're getting

//         res.render('view_req', {
//             layout: false,
//             userRequests,
//             message: userRequests.length > 0 ? 'Your Requests' : 'You have no requests yet.'
//         });
//     } catch (error) {
//         console.error('Error fetching user requests:', error);
//         res.redirect('/?error=Failed to load requests');
//     }
// });
app.get('/student/requests', async (req, res) => {
    try {
        const sessionKey = req.cookies.sessionKey;
        const session = await business.getSessionData(sessionKey);

        if (!session || !session.user) {
            return res.redirect('/login');
        }

        const semester = req.query.semester;
        let userRequests = await business.getUserRequests(session.user.email);

        // Filter requests by exact semester match
        if (semester && semester !== 'all-2025') {
            userRequests = userRequests.filter(request => {
                return request.semester === semester;
            });
        }

        res.render('view_req', {
            layout: false,
            userRequests,
            selectedSemester: semester,  // Pass the selected semester to the template
            message: semester && semester !== 'all-2025'
                ? `Showing ${semester} requests`
                : 'Showing all requests'
        });
    } catch (error) {
        console.error('Error fetching user requests:', error);
        res.redirect('/?error=Failed to load requests');
    }
});


// Start the server on port 8000
app.listen(8000, () => console.log('Server running on http://localhost:8000'));