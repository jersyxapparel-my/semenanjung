// ===========================
// SIMPLE LOGIN SYSTEM
// ===========================

// USER CREDENTIALS
const USER = {
    username: "admin",
    password: "1234"
};

// FUNCTION LOGIN
function login(username, password) {
    if (username === USER.username && password === USER.password) {
        localStorage.setItem("session", "logged-in");
        window.location.href = "dashboard.html";
    } else {
        alert("Username atau password salah!");
    }
}

// CHECK SESSION (untuk protect page)
function protectPage() {
    if (localStorage.getItem("session") !== "logged-in") {
        window.location.href = "login.html";
    }
}

// LOGOUT
function logout() {
    localStorage.removeItem("session");
    window.location.href = "login.html";
}
