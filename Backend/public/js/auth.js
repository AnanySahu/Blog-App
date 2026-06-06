const BASE_URL = "https://blog-app-fid9.onrender.com";


// REGISTER
async function register() {
  const username = document.getElementById("reg-username").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();
  alert(data.message || "Registered!");

  window.location.href = "/login.html";
}

// LOGIN
async function login() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  console.log(data); // 🔥 important for debugging

  if (data.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.user.username);

    window.location.href = "/index.html";
  } else {
    alert(data.message || "Login failed");
  }
}