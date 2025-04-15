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
app.engine('handlebars', handlebars.engine({
    helpers: {
        add: function(value, addition) {
            return value + addition;
        },
        formatDate: function(timestamp) {
            const date = new Date(timestamp);
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            };
            return date.toLocaleDateString('en-US', options);
        },
        lt: function(a, b) {
            return a < b;
        },
        gte: function(a, b) {
            return a >= b;
        },
        eq: function(a, b) {
            return a === b;
        }
    }
    }
));

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
// app.get('/admin', (req, res) => {
//     res.sendFile(path.join(__dirname, 'dist', 'admin.html'));
// });


app.get('/admin', async (req, res) => {


    try {
        const sessionKey = req.cookies.sessionKey;
        if (!sessionKey) return res.redirect('/login');

        const session = await business.getSessionData(sessionKey);
        if (!session?.user) {
            res.clearCookie('sessionKey');
            return res.redirect('/login');
        }

        // Verify admin status
        const isAdmin = session.user.isAdmin ||
                       session.user.accountType === 'Admin' ||
                       session.user.username.toLowerCase() === 'admin' ||
                       session.user.email.toLowerCase() === 'admin@udst.edu.qa';

        if (!isAdmin) {
            return res.status(403).render('error', {
                message: 'Access Denied',
                error: {
                    status: 403,
                    details: 'You must be an administrator to access this page'
                }
            });
        }

        // Get the categories data
        const categories = await business.getDashboardQueues();

        // Render the admin dashboard with categories
        res.render('admin', {
            title: 'Admin Dashboard',
            user: session.user,
            isAdmin: true,
            categories: categories
        });

    } catch (error) {
        console.error('Admin route error:', error);
        res.status(500).render('error', {
            message: 'Server Error',
            error: {
                status: 500,
                details: 'An unexpected error occurred'
            }
        });
    }
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

        const { category, description, email, semester } = req.body;

        if (email !== session.user.email) {
            return res.send(`
            <p style="color: red;">Invalid Email: Your Email Must match the one with your account</p>
            <a href="/request">Click here to try again</a>`
            );
        }

        const pendingCount = await business.getPendingRequestCount();
        const createdAt = Date.now();

        // Calculate estimated time (24 hours after creation)
        const estimatedTime = new Date(createdAt);
        estimatedTime.setHours(estimatedTime.getHours() + 24);

        const requestData = {
            studentEmail: session.user.email,
            studentName: session.user.username,
            category,
            description,
            status: 'Pending',
            semester,
            createdAt: createdAt,
            estimatedTime: estimatedTime.getTime(),

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


app.get('/student/requests', async (req, res) => {
    try {
        const sessionKey = req.cookies.sessionKey;
        const session = await business.getSessionData(sessionKey);

        if (!session || !session.user) {
            return res.redirect('/login');
        }

        const semester = req.query.semester;
        let userRequests = await business.getUserRequests(session.user.email);

        // Filter out cancelled requests and filter by semester if specified
        userRequests = userRequests.filter(request => {
            const semesterMatch = !semester || semester === 'all-2025' || request.semester === semester;
            return semesterMatch;
        });

        res.render('view_req', {
            layout: false,
            userRequests,
            selectedSemester: semester,
            message: semester && semester !== 'all-2025'
                ? `Showing ${semester} requests`
                : 'Showing all active requests'
        });
    } catch (error) {
        console.error('Error fetching user requests:', error);
        res.redirect('/?error=Failed to load requests');
    }
});

// app.get('/student/requests', async (req, res) => {
//     try {
//         const sessionKey = req.cookies.sessionKey;
//         const session = await business.getSessionData(sessionKey);

//         if (!session || !session.user) return res.redirect('/login');

//         const semester = req.query.semester;
//         let userRequests = await business.getUserRequests(session.user.email);

//         // Only filter by semester, not status
//         userRequests = userRequests.filter(request =>
//             !semester || semester === 'all-2025' || request.semester === semester
//         );

//         res.render('view_req', {
//             layout: false,
//             userRequests,
//             selectedSemester: semester,
//             message: semester && semester !== 'all-2025'
//                 ? `Showing ${semester} requests`
//                 : 'Showing all requests'
//         });
//     } catch (error) {
//         console.error('Error:', error);
//         res.redirect('/?error=Failed to load requests');
//     }
// });

// Handle cancellation form submission
app.post('/student/requests/cancel', async (req, res) => {
    try {
        const sessionKey = req.cookies.sessionKey;
        const session = await business.getSessionData(sessionKey);

        if (!session || !session.user) {
            return res.status(401).send('Unauthorized');
        }

        const { requestId } = req.body;

        // Business logic handles all validation
        await business.cancelRequest(requestId, session.user.email);

        res.redirect('/student/requests?success=Request+cancelled+successfully');
    } catch (error) {
        console.error('Cancellation error:', error);
        res.redirect(`/student/requests?error=${encodeURIComponent(error.message)}`);
    }
});

app.get('/student/cancel', async (req, res) => {
    try {
        const sessionKey = req.cookies.sessionKey;
        const session = await business.getSessionData(sessionKey);

        if (!session || !session.user) {
            return res.redirect('/login');
        }

        const semester = req.query.semester;
        let cancelledRequests = await business.getCancelledRequests(session.user.email);

        // Apply semester filter if specified and not "all-2025"
        if (semester && semester !== 'all-2025') {
            cancelledRequests = cancelledRequests.filter(request =>
                request.semester === semester
            );
        }

        res.render('cancel_req', {
            layout: false,
            cancelledRequests,
            selectedSemester: semester || 'all-2025',
            message: semester && semester !== 'all-2025'
                ? `Showing cancelled requests for ${semester}`
                : 'Showing all cancelled requests'
        });
    } catch (error) {
        console.error('Error loading cancelled requests:', error);
        res.redirect('/student/requests?error=' + encodeURIComponent(error.message));
    }
});
// app.get('/student/cancel', async (req, res) => {
//     try {
//         const session = await verifySession(req);
//         const semester = req.query.semester;

//         // This still only gets cancelled requests
//         const cancelledRequests = await business.getCancelledRequests(
//             session.user.email,
//             semester
//         );

//         res.render('cancel_req', {
//             layout: false,
//             cancelledRequests,
//             selectedSemester: semester || 'all-2025'
//         });
//     } catch (error) {
//         handleError(res, error);
//     }
// });

app.get('/request/details/:id', async (req, res) => {
    try {
        const sessionKey = req.cookies.sessionKey;
        const session = await business.getSessionData(sessionKey);

        if (!session || !session.user) {
            return res.redirect('/login');
        }

        const requestId = req.params.id;

        // Basic validation of requestId length (MongoDB IDs are 24 chars)
        if (!requestId || requestId.length !== 24) {
            return res.redirect('/student/requests?error=Invalid request ID');
        }

        const request = await business.getRequestDetails(requestId, session.user.email);

        res.render('view_details', {
            layout: false,
            request: request,
            helpers: {
                formatDate: function(date) {
                    if (!date) return 'N/A';
                    const d = new Date(date);
                    return d.toLocaleString('en-US', {
                        timeZone: 'Asia/Qatar',
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                },
                eq: function(v1, v2) {
                    return v1 === v2;
                }
            }
        });
    } catch (error) {
        console.error('Error fetching request details:', error);
        res.redirect('/student/requests?error=' + encodeURIComponent(error.message));
    }
});


/**
 * GET /admin/queue/:category
 * Shows all requests in a specific category queue
 */
// Fix the route by adding the leading slash
// app.get('/admin/queue/:category', async (req, res) => {
//     try {
//         const sessionKey = req.cookies.sessionKey;
//         const session = await business.getSessionData(sessionKey);

//         if (!session || !session.user || !session.user.isAdmin) {
//             return res.redirect('/login');
//         }

//         const category = req.params.category;
//         const requests = await business.getQueueRequests(category);

//         res.render('request_queue', {
//             layout: false,
//             title: `${category} Requests`,
//             category: category,
//             requests: requests,
//             helpers: {
//                 formatDate: function(date) {
//                     if (!date) return 'N/A';
//                     return new Date(date).toLocaleString('en-US', {
//                         timeZone: 'Asia/Qatar',
//                         weekday: 'long',
//                         month: 'long',
//                         day: 'numeric',
//                         hour: '2-digit',
//                         minute: '2-digit',
//                         hour12: true
//                     });
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('Error loading queue:', error);
//         res.status(500).render('error', {
//             layout: false,
//             message: 'Failed to load queue',
//             error: error
//         });
//     }
// });

// // Add this route in web.js for handling approve/reject
// app.post('/admin/request/:id/resolve', async (req, res) => {
//     try {
//         const sessionKey = req.cookies.sessionKey;
//         const session = await business.getSessionData(sessionKey);

//         if (!session || !session.user || !session.user.isAdmin) {
//             return res.redirect('/login');
//         }

//         const requestId = req.params.id;
//         const { action, resolutionNotes } = req.body;

//         if (!['approve', 'reject'].includes(action)) {
//             throw new Error('Invalid action');
//         }

//         const status = action === 'approve' ? 'Approved' : 'Rejected';

//         await business.resolveRequest(requestId, status, resolutionNotes);

//         res.redirect(`/admin/request/${requestId}?success=Request+${status.toLowerCase()}`);
//     } catch (error) {
//         console.error('Error resolving request:', error);
//         res.redirect(`/admin/request/${req.params.id}?error=${encodeURIComponent(error.message)}`);
//     }
// });

// // Add this route in web.js (replace existing if it exists)
// // In web.js - this route already exists but let's verify it
// app.get('/admin/request/:id', async (req, res) => {
//     try {
//         const sessionKey = req.cookies.sessionKey;
//         const session = await business.getSessionData(sessionKey);

//         if (!session || !session.user || !session.user.isAdmin) {
//             return res.redirect('/login');
//         }

//         const requestId = req.params.id;
//         const request = await business.getRequestDetails(requestId);

//         // Render the HOD-specific view details template
//         res.render('hod_viewdetails', {
//             layout: false,
//             request: request,
//             helpers: {
//                 formatDate: function(date) {
//                     if (!date) return 'N/A';
//                     const d = new Date(date);
//                     return d.toLocaleString('en-US', {
//                         timeZone: 'Asia/Qatar',
//                         weekday: 'long',
//                         month: 'long',
//                         day: 'numeric',
//                         hour: '2-digit',
//                         minute: '2-digit',
//                         hour12: true
//                     });
//                 },
//                 eq: function(v1, v2) {
//                     return v1 === v2;
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('Error fetching admin request details:', error);
//         res.redirect('/admin?error=' + encodeURIComponent(error.message));
//     }
// });

// // Handle Approve/Reject from Admin Dashboard
// app.post('/admin/request/:id/resolve', async (req, res) => {
//     try {
//         const sessionKey = req.cookies.sessionKey;
//         const session = await business.getSessionData(sessionKey);

//         if (!session?.user?.isAdmin) {
//             return res.redirect('/login');
//         }

//         const requestId = req.params.id;
//         const { action, resolutionNotes } = req.body;

//         // Validate action
//         if (!['approve', 'reject'].includes(action)) {
//             throw new Error('Invalid action');
//         }

//         // Update status (Approved or Cancelled)
//         const status = action === 'approve' ? 'Approved' : 'Cancelled';
//         await business.resolveRequest(requestId, status, resolutionNotes);

//         // Redirect back to the request's queue
//         const request = await business.getRequestDetails(requestId);
//         res.redirect(`/admin/queue/${request.category}?success=Request+${status}`);
//     } catch (error) {
//         console.error('Error resolving request:', error);
//         res.redirect(`/admin/request/${req.params.id}?error=${error.message}`);
//     }
// });

/**
 * Handles request resolution (approve/reject) from admin dashboard
 * @route POST /admin/request/:id/resolve
 */
// app.post('/admin/request/:id/resolve', async (req, res) => {
//     try {
//         // 1. Authentication and authorization
//         const sessionKey = req.cookies.sessionKey;
//         const session = await business.getSessionData(sessionKey);

//         if (!session?.user?.isAdmin) {
//             return res.redirect('/login');
//         }

//         // 2. Input validation
//         const requestId = req.params.id;
//         const { action, resolutionNotes } = req.body;

//         if (!['approve', 'reject'].includes(action)) {
//             return res.status(400).json({ error: 'Invalid action' });
//         }

//         // 3. Process resolution
//         const status = action === 'approve' ? 'Approved' : 'Cancelled';
//         const request = await business.resolveRequest(
//             requestId,
//             status,
//             resolutionNotes || 'No notes provided'
//         );

//         // 4. Return success response
//         res.send(`
//             <script>
//                 alert("Request ${status}! Notification sent to student.");
//                 window.location.href = "/admin/queue/${request.category}";
//             </script>
//         `);

//     } catch (error) {
//         console.error('Error resolving request:', error);

//         // Determine redirect based on available info
//         let redirectUrl = '/admin';
//         try {
//             const request = await business.getRequestDetails(req.params.id);
//             if (request) redirectUrl = `/admin/request/${req.params.id}`;
//         } catch (e) {}

//         res.redirect(`${redirectUrl}?error=${encodeURIComponent(error.message)}`);
//     }
// });

app.post('/admin/request/:id/resolve', async (req, res) => {
    try {
        console.log('--- STARTING RESOLUTION ---');
        console.log('Request ID:', req.params.id);
        console.log('Action:', req.body.action);
        console.log('Notes:', req.body.resolutionNotes);

        const sessionKey = req.cookies.sessionKey;
        const session = await business.getSessionData(sessionKey);
        console.log('Session valid?', !!session?.user?.isAdmin);

        if (!session?.user?.isAdmin) return res.redirect('/login');

        const { action, resolutionNotes } = req.body;
        if (!['approve', 'reject'].includes(action)) {
            throw new Error('Invalid action');
        }

        const status = action === 'approve' ? 'Approved' : 'Cancelled';
        console.log('Attempting to update status to:', status);

        const request = await business.resolveRequest(
            req.params.id,
            status,
            resolutionNotes || "No notes provided"
        );

        console.log('Update result:', request);
        console.log('--- RESOLUTION COMPLETE ---');

        res.send(`<script>
            alert("Request ${status} successfully!");
            window.location.href = "/admin/request/${req.params.id}";
        </script>`);
    } catch (error) {
        console.error('FULL ERROR:', error);
        res.redirect(`/admin/request/${req.params.id}?error=${encodeURIComponent(error.message)}`);
    }
});
/**
 * Shows request details for admin resolution
 * @route GET /admin/request/:id
 */
app.get('/admin/request/:id', async (req, res) => {
    try {
        // 1. Authentication and authorization
        const sessionKey = req.cookies.sessionKey;
        const session = await business.getSessionData(sessionKey);

        if (!session?.user?.isAdmin) {
            return res.redirect('/login');
        }

        // 2. Get request details
        const request = await business.getRequestDetails(req.params.id);
        if (!request) {
            throw new Error('Request not found');
        }

        // 3. Render admin view
        res.render('hod_viewdetails', {
            layout: false,
            request: request,
            success: req.query.success,
            error: req.query.error,
            helpers: {
                formatDate: function(date) {
                    if (!date) return 'N/A';
                    return new Date(date).toLocaleString('en-US', {
                        timeZone: 'Asia/Qatar',
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                },
                eq: function(v1, v2) {
                    return v1 === v2;
                }
            }
        });

    } catch (error) {
        console.error('Error loading admin request view:', error);
        res.redirect(`/admin?error=${encodeURIComponent(error.message)}`);
    }
});

/**
 * Shows requests queue by category
 * @route GET /admin/queue/:category
 */
app.get('/admin/queue/:category', async (req, res) => {
    try {
        // 1. Authentication and authorization
        const sessionKey = req.cookies.sessionKey;
        const session = await business.getSessionData(sessionKey);

        if (!session?.user?.isAdmin) {
            return res.redirect('/login');
        }

        // 2. Get queue requests
        const category = req.params.category;
        const requests = await business.getQueueRequests(category);

        // 3. Render queue view
        res.render('request_queue', {
            layout: false,
            title: `${category} Requests`,
            category: category,
            requests: requests,
            success: req.query.success,
            error: req.query.error,
            helpers: {
                formatDate: function(date) {
                    if (!date) return 'N/A';
                    return new Date(date).toLocaleString('en-US', {
                        timeZone: 'Asia/Qatar',
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                }
            }
        });

    } catch (error) {
        console.error('Error loading queue:', error);
        res.status(500).render('error', {
            layout: false,
            message: 'Failed to load queue',
            error: error
        });
    }
});
// Start the server on port 8000
app.listen(8000, () => console.log('Server running on http://localhost:8000'));