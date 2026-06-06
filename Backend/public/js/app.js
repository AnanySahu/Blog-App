const BASE_URL = "https://blog-app-fid9.onrender.com";

let currentPage = 1;

// ---------------- AUTH ----------------
if (!localStorage.getItem("token")) {
  window.location.href = "/login.html";
}

function logout() {
  localStorage.clear();
  location.reload();
}

function showDashboard() {
  const userNameSpan = document.getElementById("user-name");
  if (userNameSpan) {
    userNameSpan.innerText = localStorage.getItem("username");
  }
}

// ---------------- POSTS ----------------

async function loadPosts(page = 1) {
  const res = await fetch(`${BASE_URL}/posts?page=${page}&limit=5`);
  const data = await res.json();

  currentPage = data.page;
  
  // Update post count
  const postCountSpan = document.getElementById("post-count");
  if (postCountSpan && data.totalPosts) {
    postCountSpan.innerText = `${data.totalPosts} post${data.totalPosts !== 1 ? 's' : ''}`;
  }

  renderPosts(data.posts);
  renderPagination(data.page, data.totalPages);
}

function renderPosts(posts) {
  const container = document.getElementById("posts");
  container.innerHTML = "";

  if (!posts || posts.length === 0) {
    container.innerHTML = `
      <div class="no-posts">
        <p>No posts yet. Be the first to create one!</p>
      </div>
    `;
    return;
  }

  posts.forEach(post => {
    const div = document.createElement("div");
    div.className = "post-card";

    div.innerHTML = `
      <h3 class="post-title">${escapeHtml(post.title)}</h3>
      <div class="post-meta">
        <span class="post-author">By ${escapeHtml(post.author.username)}</span>
        <span class="post-date">${new Date(post.createdAt).toLocaleDateString()}</span>
      </div>

      ${post.coverImage ? `<div class="post-image"><img src="${post.coverImage}" alt="${escapeHtml(post.title)}"></div>` : ""}

      <div class="post-content">${escapeHtml(post.content)}</div>

      <div class="like-section">
        <button class="like-btn" onclick="likePost('${post._id}')">
          ❤️ <span class="like-count">${post.likes.length}</span>
        </button>
      </div>

      <div class="comments-section">
        <div class="comments-title">
          💬 Comments
        </div>
        <div id="comments-${post._id}" class="comments-list"></div>

        <div class="add-comment-form">
          <input type="text" id="comment-input-${post._id}" class="comment-input" placeholder="Write a comment...">
          <button class="comment-submit" onclick="addComment('${post._id}')">Post</button>
        </div>
      </div>
    `;

    container.appendChild(div);
    loadComments(post._id);
  });
}

// Helper function to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ---------------- PAGINATION ----------------

function renderPagination(page, totalPages) {
  if (totalPages <= 1) return;
  
  const container = document.getElementById("posts");
  
  const paginationDiv = document.createElement("div");
  paginationDiv.className = "pagination";

  paginationDiv.innerHTML = `
    <button class="pagination-btn" ${page === 1 ? "disabled" : ""} onclick="loadPosts(${page - 1})">← Previous</button>
    <span class="pagination-info">Page ${page} of ${totalPages}</span>
    <button class="pagination-btn" ${page === totalPages ? "disabled" : ""} onclick="loadPosts(${page + 1})">Next →</button>
  `;

  container.appendChild(paginationDiv);
}

// ---------------- CREATE POST ----------------

async function createPost() {
  const title = document.getElementById("post-title").value;
  const content = document.getElementById("post-content").value;
  const file = document.getElementById("post-image").files[0];

  if (!title.trim() || !content.trim()) {
    alert("Please enter both title and content");
    return;
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("content", content);
  if (file) formData.append("coverImage", file);

  const token = localStorage.getItem("token");

  try {
    await fetch(`${BASE_URL}/posts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    // Clear the form
    document.getElementById("post-title").value = "";
    document.getElementById("post-content").value = "";
    document.getElementById("post-image").value = "";
    
    loadPosts();
  } catch (error) {
    console.error("Error creating post:", error);
    alert("Failed to create post");
  }
}

// ---------------- LIKE ----------------

async function likePost(postId) {
  const token = localStorage.getItem("token");

  try {
    await fetch(`${BASE_URL}/posts/${postId}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    loadPosts(currentPage);
  } catch (error) {
    console.error("Error liking post:", error);
  }
}

// ---------------- COMMENTS ----------------

async function loadComments(postId) {
  try {
    const res = await fetch(`${BASE_URL}/posts/${postId}/comments`);
    const comments = await res.json();

    const container = document.getElementById(`comments-${postId}`);
    if (!container) return;
    
    container.innerHTML = "";

    if (comments.length === 0) {
      container.innerHTML = '<div class="comment" style="color: #999;">No comments yet. Be the first to comment!</div>';
      return;
    }

    comments.forEach(c => {
      const commentDiv = document.createElement("div");
      commentDiv.className = "comment";
      commentDiv.innerHTML = `
        <div class="comment-author">${escapeHtml(c.author.username)}</div>
        <div class="comment-text">${escapeHtml(c.content)}</div>
      `;
      container.appendChild(commentDiv);
    });
  } catch (error) {
    console.error("Error loading comments:", error);
  }
}

async function addComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const content = input.value.trim();

  if (!content) {
    alert("Please enter a comment");
    return;
  }

  const token = localStorage.getItem("token");

  try {
    await fetch(`${BASE_URL}/posts/${postId}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });

    input.value = "";
    loadComments(postId);
  } catch (error) {
    console.error("Error adding comment:", error);
    alert("Failed to add comment");
  }
}

// ---------------- INIT ----------------

if (localStorage.getItem("token")) {
  showDashboard();
  loadPosts();
}