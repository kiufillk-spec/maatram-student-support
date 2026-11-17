
// =============================================
// MAATRAM STUDENT SUPPORT SYSTEM
// FRONTEND PROTOTYPE
// =============================================

// DEMO ONLY:
// OTP = 123456
// No real SMS or email is sent.

let selectedRole = "";
let authMode = "register";
let pendingProfile = null;
let currentUser = null;


// =============================================
// 1. DATABASE (BROWSER STORAGE)
// =============================================

function getProfiles() {
    return JSON.parse(localStorage.getItem("maatramProfiles") || "[]");
}

function saveProfiles(profiles) {
    localStorage.setItem("maatramProfiles", JSON.stringify(profiles));
}

function getRequests() {
    return JSON.parse(localStorage.getItem("maatramRequests") || "[]");
}

function saveRequests(requests) {
    localStorage.setItem("maatramRequests", JSON.stringify(requests));
}


// =============================================
// 2. PAGE NAVIGATION
// =============================================

const pages = [
    "homePage",
    "authPage",
    "otpPage",
    "dashboardPage",
    "editPage"
];

function showPage(pageID) {

    pages.forEach(function(id) {
        document.getElementById(id).classList.add("hidden");
    });

    document.getElementById(pageID).classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function goHome() {
    showPage("homePage");
}


// =============================================
// 3. STUDENT / MENTOR SELECTION
// =============================================

function selectRole(role) {

    selectedRole = role;

    changeMode("register");

    const mentorBox = document.getElementById("mentorFieldBox");

    mentorBox.classList.toggle("hidden", role !== "mentor");

    document.getElementById("mentorField").required =
        role === "mentor";

    document.getElementById("authTitle").textContent =
        role === "student"
            ? "Student Registration"
            : "Mentor Registration";

    document.getElementById("authSubtitle").textContent =
        role === "student"
            ? "Create your student account."
            : "Register to guide and support students.";

    showPage("authPage");
}


// =============================================
// 4. REGISTER / LOGIN MODE
// =============================================

function changeMode(mode) {

    authMode = mode;

    const isRegister = mode === "register";

    document.getElementById("registerForm")
        .classList.toggle("hidden", !isRegister);

    document.getElementById("loginForm")
        .classList.toggle("hidden", isRegister);

    document.getElementById("registerTab")
        .classList.toggle("active", isRegister);

    document.getElementById("loginTab")
        .classList.toggle("active", !isRegister);

    document.getElementById("authTitle").textContent =
        selectedRole === "student"
            ? (isRegister ? "Student Registration" : "Student Login")
            : (isRegister ? "Mentor Registration" : "Mentor Login");

    document.getElementById("authSubtitle").textContent =
        isRegister
            ? "Create your account to continue."
            : "Enter your registered email to continue.";
}


// =============================================
// 5. PROFILE PHOTO READER
// =============================================

function readPhoto(file) {

    return new Promise(function(resolve, reject) {

        if (!file) {
            resolve("");
            return;
        }

        if (!file.type.startsWith("image/")) {
            reject(new Error("Please select an image file."));
            return;
        }

        if (file.size > 500 * 1024) {
            reject(new Error("Please choose an image under 500 KB."));
            return;
        }

        const reader = new FileReader();

        reader.onload = function() {
            resolve(reader.result);
        };

        reader.onerror = function() {
            reject(new Error("Unable to read the image."));
        };

        reader.readAsDataURL(file);

    });
}


// =============================================
// 6. REGISTRATION
// =============================================

document.getElementById("registerForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const name =
            document.getElementById("regName").value.trim();

        const email =
            document.getElementById("regEmail").value.trim().toLowerCase();

        const phone =
            document.getElementById("regPhone").value.trim();

        const field =
            document.getElementById("mentorField").value;

        const photoFile =
            document.getElementById("regPhoto").files[0];

        if (!/^[6-9][0-9]{9}$/.test(phone)) {
            alert("Enter a valid 10-digit Indian mobile number.");
            return;
        }

        const profiles = getProfiles();

        const alreadyRegistered = profiles.some(function(profile) {
            return profile.role === selectedRole &&
                   profile.email === email;
        });

        if (alreadyRegistered) {
            alert("This email is already registered. Please login.");
            changeMode("login");
            return;
        }

        if (selectedRole === "mentor" && !field) {
            alert("Please select your helping field.");
            return;
        }

        try {

            const photo = await readPhoto(photoFile);

            pendingProfile = {
                id: "USER-" + Date.now(),
                role: selectedRole,
                name: name,
                email: email,
                phone: phone,
                photo: photo,
                field: selectedRole === "mentor" ? field : "",
                verified: false,
                createdAt: new Date().toISOString()
            };

            sendDemoOTP(phone);

        } catch(error) {

            alert(error.message);

        }

    });


// =============================================
// 7. EXISTING USER LOGIN
// =============================================

document.getElementById("loginForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail")
            .value.trim().toLowerCase();

        const profile = getProfiles().find(function(item) {
            return item.email === email &&
                   item.role === selectedRole;
        });

        if (!profile) {
            alert("Account not found. Please register first.");
            return;
        }

        pendingProfile = profile;

        sendDemoOTP(profile.phone);

    });


// =============================================
// 8. DEMO OTP VERIFICATION
// =============================================

function sendDemoOTP(phone) {

    document.getElementById("otpDestination").textContent =
        "Verification for mobile ending " + phone.slice(-4);

    document.getElementById("otpCode").value = "";

    showPage("otpPage");

}

document.getElementById("otpForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const enteredOTP =
            document.getElementById("otpCode").value.trim();

        if (enteredOTP !== "123456") {
            alert("Incorrect demo OTP. Try 123456.");
            return;
        }

        if (!pendingProfile) {
            alert("Please start registration or login again.");
            showPage("homePage");
            return;
        }

        if (authMode === "register") {

            pendingProfile.verified = true;

            const profiles = getProfiles();

            profiles.push(pendingProfile);

            saveProfiles(profiles);

        }

        currentUser = pendingProfile;

        localStorage.setItem(
            "maatramSession",
            JSON.stringify({
                id: currentUser.id,
                role: currentUser.role
            })
        );

        pendingProfile = null;

        showDashboard();

    });


// =============================================
// 9. DASHBOARD
// =============================================

const categoryNames = {
    academic: "Academic Support",
    career: "Career Guidance",
    scholarship: "Scholarship Support",
    personal: "Personal Guidance",
    technical: "Technical Skills"
};

function showDashboard() {

    if (!currentUser) {
        goHome();
        return;
    }

    showPage("dashboardPage");

    document.getElementById("dashboardWelcome").textContent =
        "Welcome, " + currentUser.name + "!";

    document.getElementById("profileName").textContent =
        currentUser.name;

    document.getElementById("profileRole").textContent =
        currentUser.role.toUpperCase();

    document.getElementById("profileEmail").textContent =
        "Email: " + currentUser.email;

    document.getElementById("profilePhone").textContent =
        "Mobile: " + currentUser.phone;

    document.getElementById("profileExpertise").textContent =
        currentUser.role === "mentor"
            ? "Helping Field: " + categoryNames[currentUser.field]
            : "Student Account";

    // Display profile photo

    const profileImage =
        document.getElementById("profileImage");

    profileImage.replaceChildren();

    if (currentUser.photo) {

        const img = document.createElement("img");
        img.src = currentUser.photo;
        img.alt = "Profile photo";

        profileImage.appendChild(img);

    } else {

        profileImage.textContent =
            currentUser.name.charAt(0).toUpperCase();

    }

    const isStudent = currentUser.role === "student";

    document.getElementById("studentDashboard")
        .classList.toggle("hidden", !isStudent);

    document.getElementById("mentorDashboard")
        .classList.toggle("hidden", isStudent);

    if (isStudent) {
        renderStudentRequests();
    } else {
        renderMentorRequests();
    }

}


// =============================================
// 10. STUDENT CREATES SUPPORT REQUEST
// =============================================

document.getElementById("requestForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const category =
            document.getElementById("supportCategory").value;

        const problem =
            document.getElementById("supportProblem")
            .value.trim();

        if (!category || !problem) {
            alert("Please complete the support request.");
            return;
        }

        const request = {

            id: "MAT-" + Date.now().toString().slice(-7),

            studentID: currentUser.id,
            studentName: currentUser.name,
            email: currentUser.email,
            phone: currentUser.phone,

            category: category,
            problem: problem,

            status: "Pending",

            mentorID: null,
            mentorName: null,

            createdAt: new Date().toISOString()

        };

        const requests = getRequests();

        requests.push(request);

        saveRequests(requests);

        document.getElementById("requestForm").reset();

        alert("Your support request has been submitted!");

        renderStudentRequests();

    });


// =============================================
// 11. STUDENT REQUEST HISTORY
// =============================================

function renderStudentRequests() {

    const list =
        document.getElementById("studentRequests");

    list.replaceChildren();

    const requests = getRequests().filter(function(request) {
        return request.studentID === currentUser.id;
    });

    if (requests.length === 0) {
        list.textContent = "You have not submitted any requests yet.";
        return;
    }

    requests.forEach(function(request) {

        const card = document.createElement("div");
        card.className = "request-card";

        const title = document.createElement("h3");
        title.textContent = categoryNames[request.category];

        const id = document.createElement("p");
        id.textContent = "Request ID: " + request.id;

        const problem = document.createElement("p");
        problem.textContent = "Problem: " + request.problem;

        const status = document.createElement("span");
        status.className = "status";
        status.textContent = request.status;

        const mentor = document.createElement("p");
        mentor.textContent = request.mentorName
            ? "Assigned Mentor: " + request.mentorName
            : "Mentor: Waiting for assignment";

        card.append(title, id, problem, status, mentor);

        list.appendChild(card);

    });

}


// =============================================
// 12. MENTOR DASHBOARD
// =============================================

function renderMentorRequests() {

    const list =
        document.getElementById("mentorRequests");

    list.replaceChildren();

    const requests = getRequests().filter(function(request) {

        return request.category === currentUser.field &&
               (!request.mentorID ||
                request.mentorID === currentUser.id);

    });

    if (requests.length === 0) {

        list.textContent =
            "No matching student requests are available yet.";

        return;

    }

    requests.forEach(function(request) {

        const card = document.createElement("div");
        card.className = "request-card";

        const title = document.createElement("h3");
        title.textContent = request.studentName;

        const category = document.createElement("p");
        category.textContent =
            "Category: " + categoryNames[request.category];

        const problem = document.createElement("p");
        problem.textContent =
            "Student Problem: " + request.problem;

        const email = document.createElement("p");
        email.textContent = "Email: " + request.email;

        const status = document.createElement("span");
        status.className = "status";
        status.textContent = request.status;

        const actions = document.createElement("div");
        actions.className = "request-actions";

        const isAssigned =
            request.mentorID === currentUser.id;

        if (request.status === "Pending" && !request.mentorID) {

            const accept = document.createElement("button");
            accept.textContent = "Accept Request";

            accept.addEventListener("click", function() {

                updateRequest(request.id, {
                    status: "Accepted",
                    mentorID: currentUser.id,
                    mentorName: currentUser.name
                });

            });

            actions.appendChild(accept);

        }

        if (isAssigned) {

            const progress = document.createElement("button");
            progress.textContent = "In Progress";

            progress.disabled =
                request.status === "Resolved";

            progress.addEventListener("click", function() {

                updateRequest(request.id, {
                    status: "In Progress"
                });

            });

            const resolve = document.createElement("button");
            resolve.textContent = "Resolve Request";

            resolve.disabled =
                request.status === "Resolved";

            resolve.addEventListener("click", function() {

                updateRequest(request.id, {
                    status: "Resolved"
                });

            });

            actions.append(progress, resolve);

        }

        card.append(
            title,
            category,
            problem,
            email,
            status,
            actions
        );

        list.appendChild(card);

    });

}


// =============================================
// 13. UPDATE REQUEST STATUS
// =============================================

function updateRequest(requestID, updates) {

    const requests = getRequests();

    const index = requests.findIndex(function(request) {
        return request.id === requestID;
    });

    if (index === -1) return;

    requests[index] = {
        ...requests[index],
        ...updates
    };

    saveRequests(requests);

    renderMentorRequests();

}


// =============================================
// 14. EDIT PROFILE
// =============================================

function openEditProfile() {

    document.getElementById("editName").value =
        currentUser.name;

    document.getElementById("editEmail").value =
        currentUser.email;

    document.getElementById("editPhone").value =
        currentUser.phone;

    document.getElementById("editPhoto").value = "";

    const mentorBox =
        document.getElementById("editMentorFieldBox");

    mentorBox.classList.toggle(
        "hidden",
        currentUser.role !== "mentor"
    );

    if (currentUser.role === "mentor") {
        document.getElementById("editMentorField").value =
            currentUser.field;
    }

    showPage("editPage");

}


document.getElementById("editForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const name =
            document.getElementById("editName").value.trim();

        const phone =
            document.getElementById("editPhone").value.trim();

        if (!/^[6-9][0-9]{9}$/.test(phone)) {
            alert("Enter a valid mobile number.");
            return;
        }

        const photoFile =
            document.getElementById("editPhoto").files[0];

        try {

            const newPhoto = await readPhoto(photoFile);

            const profiles = getProfiles();

            const index = profiles.findIndex(function(profile) {
                return profile.id === currentUser.id;
            });

            if (index === -1) {
                alert("Profile not found.");
                return;
            }

            currentUser.name = name;
            currentUser.phone = phone;

            if (newPhoto) {
                currentUser.photo = newPhoto;
            }

            if (currentUser.role === "mentor") {

                currentUser.field =
                    document.getElementById("editMentorField").value;

            }

            profiles[index] = currentUser;

            saveProfiles(profiles);

            alert("Profile updated successfully!");

            showDashboard();

        } catch(error) {

            alert(error.message);

        }

    });


// =============================================
// 15. LOGOUT
// =============================================

function logout() {

    currentUser = null;

    localStorage.removeItem("maatramSession");

    showPage("homePage");

}


// =============================================
// 16. RESTORE SESSION AFTER REFRESH
// =============================================

function restoreSession() {

    const savedSession =
        JSON.parse(localStorage.getItem("maatramSession") || "null");

    if (!savedSession) {
        showPage("homePage");
        return;
    }

    const profile = getProfiles().find(function(item) {

        return item.id === savedSession.id &&
               item.role === savedSession.role;

    });

    if (profile) {

        currentUser = profile;
        showDashboard();

    } else {

        localStorage.removeItem("maatramSession");
        showPage("homePage");

    }

}

restoreSession();
