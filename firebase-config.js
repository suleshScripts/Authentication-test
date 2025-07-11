// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "https://www.gstatic.com/firebasejs/9.6.8/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDqwuG3-icTGSNTOR5zp435l7jWe4fyq60",
  authDomain: "admin-login-474db.firebaseapp.com",
  projectId: "admin-login-474db",
  storageBucket: "admin-login-474db.appspot.com",
  messagingSenderId: "426708336385",
  appId: "1:426708336385:web:5cc191b17f125690ea6500"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, RecaptchaVerifier, signInWithPhoneNumber, ref, set };
