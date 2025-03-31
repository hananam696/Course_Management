
# Group members Hanan, Raghad, Amna

#Team Meeting Times
| Day        | Time                         |
|------------|-----------------------------|
| Saturday   | 10:00 - 11:00                |
| Sunday     | 1:00 - 3:30 (2:00 - 3:30)    |
| Monday     | 10:00 - 11:00, 2:00 - 3:00   |
| Tuesday    | 2:00 - 3:00                  |
| Wednesday  | 2:00 - 3:30                  |

---------------------------------------------------
## Milestone Submission 
### 📌 Tasks:
- [ ] **User Registration**
  - [ ] Create registration form (name, contact, degree)
  - [ ] Store user data in MongoDB
  - [ ] Email verification via `console.log()`
  - [ ] Block login until verified

- [ ] **Session Implementation**
  - [ ] Use session cookies
  - [ ] Restrict access if no session
  - [ ] Passwords must be hashed (not in plain text)

- [ ] **Basic Login System**
  - [ ] Allow login for students and HoD
  - [ ] Different views for student and HoD

- [ ] **Code Structure**
  - [ ] Use clear variable/function names
  - [ ] Proper formatting
  - [ ] Add documentation/comments
  - [ ] Follow the architecture model

- [ ] **CoreUI Template**
  - [ ] Begin integrating CoreUI layout (optional for milestone)

- [ ] **Submission**
  - [ ] Create private GitHub repo, add instructor
  - [ ] Submit ZIP of project on D2L

---

## Collaboration 
### 📌 Tasks:
- [ ] **GitHub Activity**
  - [ ] Commit regularly (not just last minute)
  - [ ] Write meaningful commit messages

- [ ] **Team Contribution**
  - [ ] All members contribute
  - [ ] Take GitHub commit screenshots
  - [ ] Submit screenshots in Word file on D2L

---

## Final Submission   
### 📌 Features & Tasks:

- [ ] **User Registration & Management (4 pts)**
  - [ ] Full registration with field validation
  - [ ] Email verification logic
  - [ ] Password reset (token-based or similar)

- [ ] **Request Submission (4 pts)**
  - [ ] Students submit categorized requests
  - [ ] Requests saved to MongoDB
  - [ ] Estimate processing time based on queue size

- [ ] **HoD View Requests (5 pts)**
  - [ ] HoD dashboard with request queues
  - [ ] View request list in each queue
  - [ ] Show stats per queue

- [ ] **HoD Process Requests (5 pts)**
  - [ ] View and update request details
  - [ ] Approve/Reject + message
  - [ ] Log simulated email via `console.log()`
  - [ ] “I don’t know where to begin” randomizer

- [ ] **Style & Design (3 pts)**
  - [ ] Use CoreUI on all pages
  - [ ] Ensure responsiveness for desktop & mobile

- [ ] **Final Video Submission**
  - [ ] Record a 10-min project walkthrough
  - [ ] Upload to YouTube (unlisted)
  - [ ] Include video link in submission

- [ ] **Final D2L Submission**
  - [ ] ZIP file of complete project
  - [ ] Include `README.md` with run instructions
  - [ ] Ensure app runs with `npm install` and `node web.js`

---

## 🔐 Security & Tech Constraints
- [ ] Do NOT use `express-session`
- [ ] Do NOT use external CSRF packages
- [ ] Only client-side JS allowed: form validation
- [ ] Email via `console.log()` only

---

## 📁 Repository Checklist
- [ ] GitHub repo is **private**
- [ ] All team members added as collaborators
- [ ] Instructor added as collaborator

---

## 📽️ Final Video Tips
- Focus on:
  - Registration flow
  - Request creation
  - HoD view and processing
  - Queue system + estimates
  - CSRF protection example
  - CoreUI layout use


---------------------------------------------------

## Login to the admin account information
ADMIN ACCOUNT DETAILS :
username: admin
email: admin@udst.edu.qa
password: 12admin34

## Team Contributions
Everyone contributed to every function, working closely together to refine and perfection in each part.
Our collaborative approach ensured not only a seamless and well-executed outcome but also strengthened our problem-solving and teamwork skills

### Amna0712
- Participated in the initial project setup
- Created persistence, business, web.js
- Contributed to the registration page
- User profile setup
- Fixed session keys
- Implemented redirection to the homepage after login.
- Created TTL for session key and set it to expire within 5 minutes
- Contributed to the activation code
- Worked with verification
- Worked on all the layers of closed architecuture
- Made the defualt 8000 port directing login page
- Editing the codes and comments
- Modified the README file
- Formatting
- and many more

### Raghad258
- Participated in the initial project setup
- Implemented password hashing, session handling, and JSON file management.
- Updated `web.js`, contributed to the login system.
- Worked on structuring authentication and security features.
- Worked on admin privileges criteria
- Worked on all the layers of closed architecuture
- Editing the codes
- Worked with verification
- Modified the README file
- Formatting
- and many more

### Hananam696
- Participated in the initial project setup
- Worked on MongoDB integration, persistence, and business logic.
- Updated login handlebars, form submissions, and HTML presentation.
- Implemented hash function, and used crypto
- Added session keys
- Made improvements to session handling and project architecture.
- Fixed admin go to admin dashboard and user not having access to admin dashboard
- Created activate handlebar
- Fixed the activation issues
- Worked on all the layers of closed architecuture
- Editing the codes
- Fixed the form submission issues
- Made the defualt 8000 port directing login page
- Modified the README file
- Redirect back to login page if sunccessfully user logged in
- Modified login such as if user entered incorrect credentials it will show  error messgae in red
  and link to go back to login page to try again
- After activation user gets a link to go to login page directly
- Formatting
- and many more


## Extra Requirements Done
These extra features that were not explicitly required but enhance the functionality and user experience of the system:

- Error Handling:
Clear error messages for incorrect login credentials.
Gave link to go back to login page after errors.

- Activation Flow:
After activation, users are redirected to the login page directly.
Redirection to the login page after errors.

- Port Configuration:
The default port (8000) directs users to the login page.

- Code Refactoring and Formatting:
Code was edited, commented, and formatted for clarity.

### Regular team meetings were held to coordinate efforts.

