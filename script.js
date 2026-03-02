// 1. Import Firebase core and features from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 2. Your specific Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYigdQAf7mLEYp4Rr-lI9cT69BhT5E3U8",
  authDomain: "campus-portal-d6e14.firebaseapp.com",
  projectId: "campus-portal-d6e14",
  storageBucket: "campus-portal-d6e14.firebasestorage.app",
  messagingSenderId: "453060412787",
  appId: "1:453060412787:web:1e92ea00ccb8725067b106",
  measurementId: "G-9YYGQGBX9S"
};

// 3. Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// UI Elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userNameInput = document.getElementById('userName');
const messagesContainer = document.getElementById('messages-container');
const hamburger = document.getElementById('hamburger-icon');
const navMenu = document.getElementById('nav-menu');

let currentUser = null;

// --- AUTHENTICATION LOGIC ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        userNameInput.value = user.displayName;
        userNameInput.disabled = true; 
    } else {
        currentUser = null;
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        userNameInput.value = '';
        userNameInput.placeholder = 'Sign in to post';
        userNameInput.disabled = true;
    }
});

loginBtn.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Login Failed:", error.message);
        alert("Failed to log in. Please try again.");
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout Failed:", error.message);
    }
});


// --- MOBILE MENU LOGIC ---
// Toggle menu open/closed when clicking the hamburger lines
hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active-menu');
});


// --- NAVIGATION LOGIC ---
window.showSection = function(sectionId) {
    document.querySelectorAll('section').forEach(section => {
        section.classList.remove('active');
    });

    document.querySelectorAll('.nav-links button').forEach(btn => {
        btn.classList.remove('active-btn');
    });

    document.getElementById(sectionId).classList.add('active');

    const clickedButton = Array.from(document.querySelectorAll('.nav-links button')).find(btn => btn.getAttribute('onclick')?.includes(sectionId));
    if (clickedButton) {
        clickedButton.classList.add('active-btn');
    }

    // NEW: Close the mobile menu automatically after clicking a button
    navMenu.classList.remove('active-menu');

    window.scrollTo({ top: 0, behavior: 'smooth' });
};


// --- DATABASE LOGIC (APPRECIATION WALL) ---
window.postMessage = async function() {
    const messageInput = document.getElementById('userMessage');
    const messageText = messageInput.value.trim();

    if (messageText === '') {
        alert("Please write a message before posting!");
        return;
    }

    if (!currentUser) {
        alert("Please sign in with Google to post a message!");
        return;
    }

    try {
        await addDoc(collection(db, "messages"), {
            text: messageText,
            author: currentUser.displayName,
            createdAt: serverTimestamp()
        });
        messageInput.value = ''; 
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Could not post message. Check console for details.");
    }
};

const messagesQuery = query(collection(db, "messages"), orderBy("createdAt", "desc"));

onSnapshot(messagesQuery, (snapshot) => {
    messagesContainer.innerHTML = ''; 
    
    if (snapshot.empty) {
        messagesContainer.innerHTML = '<p style="text-align: center; width: 100%; color: gray;">No messages yet. Be the first to post!</p>';
        return;
    }

    snapshot.forEach((doc) => {
        const data = doc.data();
        const newCard = document.createElement('div');
        newCard.className = 'message-card';
        newCard.style.animation = "fadeIn 0.5s ease-out";
        
        newCard.innerHTML = `
            <p>"${data.text}"</p>
            <span class="author">- ${data.author || 'Anonymous'}</span>
        `;
        messagesContainer.appendChild(newCard);
    });
}, (error) => {
    console.error("Error fetching messages:", error);
    messagesContainer.innerHTML = '<p style="text-align: center; width: 100%; color: red;">Error loading messages. Did you enable Firestore Test Mode?</p>';
});