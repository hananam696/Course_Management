const persistence = require('./persistence');
const crypto = require("crypto");

/**
 * Computes a SHA-256 hash of a given password.
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} - The hashed password.
 */
async function computeHash(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Computes a SHA-256 hash of a given activation code.
 * @param {string} activationCode - The activation code to hash.
 * @returns {Promise<string>} - The hashed activation code.
 */
async function computeActivationCodeHash(activationCode) {
    return crypto.createHash('sha256').update(activationCode).digest('hex');
}

/**
 * Validates if the provided email follows a valid format.
 * @param {string} email - The email to validate.
 * @returns {boolean} - True if valid, otherwise false.
 */
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

/**
 * Registers a new user by checking username/email availability, hashing the password, and storing the user data.
 * @param {string} username - The username of the new user.
 * @param {string} email - The email of the new user.
 * @param {string} password - The password of the new user.
 * @throws {Error} - If the email format is invalid, email/username already exists.
 * @returns {Promise<Object>} - The created user object.
 */
async function registerUser(userData) {
    const { username, email, password, degreeProgram } = userData;

    if (!isValidEmail(email)) throw new Error('Invalid email format');

    const existingEmail = await persistence.findUserByEmail(email);
    if (existingEmail) throw new Error('Email already exists');

    const existingUser = await persistence.findUserByUsername(username);
    if (existingUser) throw new Error('Username already taken');

    if (userData.password !== userData.repeatPassword) {
        throw new Error('Passwords do not match');
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(userData.password)) {
        throw new Error('Password must be minimum 8 characters and it must include at least one letter and number');
    }

    const hashedPassword = await computeHash(password);
    const activationCode = crypto.randomBytes(16).toString('hex');
    const hashedActivationCode = await computeActivationCodeHash(activationCode);

    console.log(`Email sent to ${email} with activation code: ${activationCode}`);

    return persistence.createUser({
        username,
        email,
        password: hashedPassword,
        activationCode: hashedActivationCode,
        active: false,
        accountType: "Student",
        degreeProgram: degreeProgram || null
    });
}

/**
 * Activates a user account by verifying the activation code.
 * @param {string} email - The email of the user to activate.
 * @param {string} activationCode - The activation code provided by the user.
 * @throws {Error} - If the user does not exist or the activation code is invalid.
 * @returns {Promise<Object>} - The activated user object.
 */
async function activateUser(email, activationCode) {
    const hashedActivationCode = await computeActivationCodeHash(activationCode);
    const user = await persistence.findUserByEmail(email);

    if (!user) {
        console.error(`User not found: ${email}`);
        throw new Error('User not found: Enter correct Email Address and Activation code');
    }
    if (user.activationCode !== hashedActivationCode) {
        console.error('Activation code mismatch');
        throw new Error('Invalid activation code');
    }

    await persistence.updateUser({ email, active: true });
    return user;
}

/**
 * Logs in a user by verifying credentials and creates a session.
 * @param {string} identifier - The username or email of the user.
 * @param {string} password - The user's password.
 * @throws {Error} - If the credentials are invalid or the account is not activated.
 * @returns {Promise<{sessionKey: string, isAdmin: boolean}>} - The session key and admin status.
 */
const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL = "admin@udst.edu.qa";
const ACCOUNT_TYPE = "Admin"

async function loginUser(identifier, password) {
    let user;
    if (identifier.includes('@')) {
        user = await persistence.findUserByEmail(identifier);
    } else {
        user = await persistence.findUserByUsername(identifier);
    }

    if (!user) throw new Error('Invalid credentials');
    if (!user.active) throw new Error('Account not activated. Please verify your email.');
    const hashedPassword = await computeHash(password);
    if (hashedPassword !== user.password) throw new Error('Invalid credentials');

    const isAdmin = user.username === ADMIN_USERNAME || user.email === ADMIN_EMAIL || user.accountType === ACCOUNT_TYPE;
    const sessionKey = crypto.randomBytes(16).toString('hex');
    const sessionData = {
        sessionKey,
        user: {
            email: user.email,
            username: user.username,
            isAdmin: isAdmin
        },
        expiry: new Date(Date.now() + 5 * 60 * 1000)
    };

    await persistence.updateSession(sessionKey, sessionData);
    return {
        sessionKey,
        isAdmin,
    };
}

/**
 * Retrieves session data for a given session key.
 * @param {string} key - The session key.
 * @returns {Promise<Object|null>} - The session data or null if expired/not found.
 */
async function getSessionData(key) {
    return await persistence.getSessionData(key);
}

/**
 * Deletes a session associated with a given session key.
 * @param {string} key - The session key.
 * @returns {Promise<void>}
 */
async function deleteSession(key) {
    return await persistence.deleteSession(key);
}

/**
 * Initiates a password reset process by generating a reset key and expiry time
 * @param {string} email - The email address of the user requesting password reset
 * @returns {Promise<void>} Resolves when reset process is initiated
 * @throws {Error} If there's an issue updating the user record
 */
async function resetPassword(email) {
    const user = await persistence.findUserByEmail(email);
    if (!user) return;

    user.resetKey = crypto.randomUUID();
    user.resetKeyExpiry = Date.now() + 120000;
    await persistence.updateUser(user);
    console.log(`Password reset link: http://localhost:8080/activate-password?key=${encodeURIComponent(user.resetKey)}`);
}

/**
 * Validates a password reset key and checks if it's expired
 * @param {string} key - The reset key to validate
 * @returns {Promise<Object|null>} User document if key is valid and not expired, null otherwise
 */
async function checkReset(key) {
    return await persistence.checkReset(key);
}

/**
 * Updates a user's password and clears the reset credentials
 * @param {string} key - The valid reset key
 * @param {string} newPassword - The new password to set
 * @returns {Promise<void>} Resolves when password is updated
 * @throws {Error} If reset key is invalid or password update fails
 */
async function setPassword(key, newPassword) {
    const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');
    await persistence.updatePassword(key, hashedPassword);

    const user = await persistence.checkReset(key);
    if (user) {
        await persistence.updateUser({
            email: user.email,
            resetKey: null,
            resetKeyExpiry: null
        });
    }
}

/**
 * Creates a new request in the system and logs confirmation
 * @param {Object} requestData - The request data to create
 * @param {string} requestData.studentName - Name of the student making the request
 * @param {string} requestData.studentEmail - Email of the student making the request
 * @param {string} requestData.category - Category of the request
 * @param {string} requestData.description - Description of the request
 * @param {string} requestData.semester - Semester the request relates to
 * @returns {Promise<Object>} The created request document
 * @throws {Error} If request creation fails
 */
async function createRequest(requestData) {
    try {
        const result = await persistence.insertRequest(requestData);
        console.log(`\n[Request confirmation]`);
        console.log(`Username: ${requestData.studentName}`);
        console.log(`Email: ${requestData.studentEmail}`);
        console.log(`Body: Hello ${requestData.studentName}, your request has been received successfully.`);
        return result;
    } catch (error) {
        console.error('Error in createRequest:', error);
        throw new Error('Error creating request');
    }
}

/**
 * Retrieves all requests made by a specific user.
 * @param {string} email - The email of the student whose requests should be fetched.
 * @returns {Promise<Array>} - A list of requests made by the student.
 */

async function getUserRequests(email) {
    try {
        return await persistence.getRequestsByEmail(email);
    } catch (error) {
        console.error('Error in getUserRequests:', error);
        throw new Error('Error retrieving user requests');
    }
}

/**
 * Gets requests filtered by semester and email
 * @param {string} email - Student email
 * @param {string} semester - Semester value (e.g., "spring-2024")
 * @returns {Promise<Array>} Filtered requests
 */
async function getRequestsBySemester(email, semester) {
    try {
        const allRequests = await persistence.getRequestsByEmail(email);

        if (semester === 'all-2023') {
            return allRequests;
        }

        const targetYear = semester.split('-')[1];
        return allRequests.filter(request => {
            const requestYear = new Date(request.createdAt).getFullYear().toString();
            return requestYear === targetYear;
        });
    } catch (error) {
        throw new Error('Error filtering requests by semester');
    }
}

/**
 * Retrieves the count of all pending requests in the system
 * @returns {Promise<number>} The number of pending requests
 * @throws {Error} If there's an error accessing the database
 */
async function getPendingRequestCount() {
    return await persistence.getPendingRequestCount();
}

/**
 * Calculates the estimated completion time for a request based on queue position
 * @param {number} queuePosition - The position in the processing queue (1-based index)
 * @returns {Promise<Date>} The estimated completion date/time
 * @description Accounts for working hours (8am-5pm) and skips weekends
 */
async function calculateEstimatedTime(queuePosition) {
    const WORKING_HOURS = { start: 8, end: 17 };
    const MINUTES_PER_REQUEST = 15;

    let estimatedTime = new Date();
    let minutesRemaining = queuePosition * MINUTES_PER_REQUEST;

    while (estimatedTime.getHours() < WORKING_HOURS.start ||
           estimatedTime.getHours() >= WORKING_HOURS.end ||
           estimatedTime.getDay() === 0 ||
           estimatedTime.getDay() === 6) {
        estimatedTime.setDate(estimatedTime.getDate() + 1);
        estimatedTime.setHours(WORKING_HOURS.start, 0, 0, 0);
    }

    while (minutesRemaining > 0) {
        const endOfDay = new Date(estimatedTime);
        endOfDay.setHours(WORKING_HOURS.end, 0, 0, 0);

        const availableMinutes = (endOfDay - estimatedTime) / (1000 * 60);
        const minutesToProcess = Math.min(availableMinutes, minutesRemaining);

        estimatedTime = new Date(estimatedTime.getTime() + minutesToProcess * 60000);
        minutesRemaining -= minutesToProcess;

        if (minutesRemaining > 0) {
            estimatedTime.setDate(estimatedTime.getDate() + 1);
            estimatedTime.setHours(WORKING_HOURS.start, 0, 0, 0);
        }
    }

    return estimatedTime;
}

/**
 * Formats a date for display in Qatar timezone
 * @param {Date|string} date - The date to format
 * @returns {Promise<string>} Formatted date string (e.g., "Monday April 15 at 02:30 PM") or "N/A" if null
 */
async function formatQatarDate(date) {
    if (!date) return 'N/A';

    return new Date(date).toLocaleString('en-US', {
        timeZone: 'Asia/Qatar',
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).replace(',', ' at');
}

/**
 * Cancels a specific request with proper validation
 * @param {string} requestId - The request ID to cancel
 * @param {string} userEmail - The user's email for verification
 * @returns {Promise<Object>} The cancelled request
 * @throws {Error} If request not found or not owned by user
 */
async function cancelRequest(requestId, userEmail) {
    try {
        const request = await persistence.cancelRequest(requestId, userEmail);

        return {
            ...request,
            _id: request._id.toString(),
            cancelledAt: request.cancelledAt || new Date()
        };
    } catch (error) {

        console.error('Error in business.cancelRequest:', error);
        throw error;
    }
}

/**
 * Retrieves cancelled requests for a student with optional semester filtering
 * @param {string} email - Student's email address
 * @param {string} [semester=null] - Optional semester filter
 * @returns {Promise<Array>} Array of formatted cancelled request objects
 * @throws {Error} If database access fails
 */
async function getCancelledRequests(email, semester = null) {
    let query = {
        studentEmail: email,
        status: 'Cancelled'
    };
    if (semester && semester !== 'all-2025') {
        query.semester = semester;
    }

    const requests = await persistence.getCancelledRequests(query);
    const formattedRequests = [];

    for (let i = 0; i < requests.length; i++) {
        const request = requests[i];

        const formattedRequest = {
            _id: request._id.toString(),
            studentEmail: request.studentEmail,
            studentName: request.studentName,
            category: request.category,
            description: request.description,
            status: request.status,
            semester: request.semester,
            createdAt: request.createdAt,
            estimatedTime: request.estimatedTime,
            cancelledAt: request.cancelledAt || request.updatedAt,
            updatedAt: request.updatedAt


        };

        formattedRequests.push(formattedRequest);
    }

    return formattedRequests;
}

/**
 * Gets detailed information about a specific request.
 * @param {string} requestId - The ID of the request.
 * @param {string} userEmail - The email of the user making the request.
 * @returns {Promise<Object>} - The request details.
 */
async function getRequestDetails(requestId, userEmail = null) {
    try {
        const request = await persistence.getRequestById(requestId);

        if (!request) {
            throw new Error('Request not found');
        }

        if (userEmail && request.studentEmail !== userEmail) {
            throw new Error('Unauthorized access to request');
        }

        return {
            _id: request._id.toString(),
            studentEmail: request.studentEmail,
            studentName: request.studentName,
            category: request.category,
            description: request.description,
            status: request.status,
            semester: request.semester,
            createdAt: request.createdAt,
            estimatedTime: request.estimatedTime,
            cancelledAt: request.cancelledAt,
            resolutionNotes: request.resolutionNotes
        };
    } catch (error) {
        console.error('Error in getRequestDetails:', error);
        throw error;
    }
}

/**
 * Gets dashboard queue data with counts of pending requests by category
 * @returns {Promise<Array>} Array of category objects with name and count properties
 * @throws {Error} If data loading fails
 */
async function getDashboardQueues() {
    try {
        const categoryCounts = await persistence.getPendingRequestCountsByCategory();

        const categoryMapping = {
            'Course Registration': 'Course Registration',
            'Grade Appeal': 'Grade Appeal',
            'Schedule Change': 'Schedule Change',
            'Graduation': 'Graduation',
            'Leave of Absence': 'Leave of Absence',
            'Financial Aid': 'Financial Aid',
            'Academic Advising': 'Academic Advising',
            'Other': 'Other'
        };

        const allCategories = Object.values(categoryMapping).map(name => ({
            name,
            count: 0
        }));

        for (const dbCategory of categoryCounts) {
            const displayName = categoryMapping[dbCategory._id] || dbCategory._id;
            const category = allCategories.find(c => c.name === displayName);
            if (category) {
                category.count = dbCategory.count;
            }
        }

        return allCategories;
    } catch (error) {
        console.error('Error in getDashboardQueues:', error);
        throw new Error('Failed to load dashboard data');
    }
}


/**
 * Gets all requests in a specific category/queue
 * @param {string} category - The request category/queue name
 * @returns {Promise<Array>} List of requests in the queue
 */
async function getQueueRequests(category) {
    try {
        const requests = await persistence.getRequestsByCategory(category);
        return requests.map(request => ({
            ...request,
            _id: request._id.toString(),
            createdAt: request.createdAt,
            statusClass: getStatusClass(request.status)
        }));
    } catch (error) {
        console.error(`Error getting queue requests for ${category}:`, error);
        throw new Error('Failed to get queue requests');
    }
}


// Helper function to get CSS class for status
function getStatusClass(status) {
    const statusClasses = {
        'Pending': 'warning',
        'Approved': 'success',
        'Cancelled': 'danger'
    };
    return statusClasses[status] || 'secondary';
}

/**
 * Resolves a request by updating its status and adding resolution notes
 * @param {string} requestId - The ID of the request to resolve
 * @param {string} status - New status ('Approved' or 'Rejected')
 * @param {string} resolutionNotes - Notes about the resolution
 * @returns {Promise<Object>} The updated request document
 * @throws {Error} If request not found, update fails, or notification fails
 * @description Verifies the update and sends notification email to student
 */
async function resolveRequest(requestId, status, resolutionNotes) {
    try {
         {
            requestId,
            status,
            resolutionNotes
        };

        const existingRequest = await persistence.getRequestById(requestId);
        if (!existingRequest) {
            throw new Error('Request not found');
        }

        console.log('Existing status:', existingRequest.status);

        //Update in persistence
        const updateSuccess = await persistence.resolveRequest(
            requestId,
            status,
            resolutionNotes
        );

        console.log('Persistence update success:', updateSuccess);

        //Verify update
        const updatedRequest = await persistence.getRequestById(requestId);
        if (updatedRequest.status !== status) {
            throw new Error('Status update verification failed');
        }

        //Send notification
        console.log('Sending notification...');
        await this.sendStatusEmail(
            updatedRequest.studentEmail,
            status,
            resolutionNotes
        );

        return updatedRequest;
    } catch (error) {
        throw error;
    }
}

/**
 * Simulates sending status email (logs to console)
 * @param {string} email - Recipient email
 * @param {string} status - 'Approved' or 'Cancelled'
 * @param {string} notes - Resolution notes
 */
async function sendStatusEmail(email, status, notes) {
    console.log('\n=== EMAIL NOTIFICATION ===');
    console.log(`To: ${email}`);
    console.log(`Subject: Your request has been ${status}`);
    console.log(`Body:`);
    console.log(`Dear Student,\n\nYour request has been ${status}.`);
    if (notes) console.log(`\nAdministrator Notes: ${notes}`);
    console.log('=========================\n');
    return true;
}

/**
 * Gets a random pending request from any queue
 * @returns {Promise<Object|null>} Random request or null if none found
 */
async function getRandomPendingRequest() {
    return await persistence.getRandomPendingRequest();
}

module.exports = {
    registerUser,
    activateUser,
    loginUser,
    getSessionData,
    deleteSession,
    resetPassword,
    checkReset,
    setPassword,
    createRequest,
    getUserRequests,
    getUserRequests,
    getRequestsBySemester,
    getPendingRequestCount,
    calculateEstimatedTime,
    formatQatarDate,
    cancelRequest,
    getCancelledRequests,
    getRequestDetails,
    getDashboardQueues,
    getQueueRequests,
    resolveRequest,
    sendStatusEmail,
    getRandomPendingRequest
};
