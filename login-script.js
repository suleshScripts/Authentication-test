// script.js
import {
    auth,
    db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    ref,
    set,
  } from './firebase-config.js'
  
  let currentForm = "loginForm"
  let otpTimer = null
  let timerCount = 60
  let confirmationResult = null
  
  function showForm(formId) {
    const currentFormElement = document.getElementById(currentForm)
    const newFormElement = document.getElementById(formId)
  
    if (currentFormElement) {
      currentFormElement.classList.remove("active")
    }
  
    setTimeout(() => {
      if (newFormElement) {
        newFormElement.classList.add("active")
        currentForm = formId
      }
    }, 250)
  }
  
  function togglePassword(inputId) {
    const input = document.getElementById(inputId)
    const button = input.nextElementSibling.nextElementSibling
  
    if (input.type === "password") {
      input.type = "text"
      button.innerHTML = '<span class="eye-icon">🙈</span>'
    } else {
      input.type = "password"
      button.innerHTML = '<span class="eye-icon">👁️</span>'
    }
  }
  
  function checkPasswordStrength(password) {
    let strength = 0
    const checks = [
      /.{8,}/,
      /[a-z]/,
      /[A-Z]/,
      /[0-9]/,
      /[^A-Za-z0-9]/,
    ]
  
    checks.forEach((check) => {
      if (check.test(password)) strength++
    })
  
    return strength
  }
  
  function updatePasswordStrength() {
    const password = document.getElementById("registerPassword").value
    const strengthFill = document.querySelector(".strength-fill")
    const strengthText = document.querySelector(".strength-text")
  
    const strength = checkPasswordStrength(password)
    const percentage = (strength / 5) * 100
  
    strengthFill.style.width = percentage + "%"
  
    const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"]
    const strengthColors = ["#ff4757", "#ff6b7a", "#ffa502", "#f39c12", "#2ed573"]
  
    if (password.length > 0) {
      strengthText.textContent = strengthLabels[strength - 1] || "Very Weak"
      strengthFill.style.background = strengthColors[strength - 1] || "#ff4757"
    } else {
      strengthText.textContent = "Password strength"
      strengthFill.style.width = "0%"
    }
  }
  
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  function showError(message, formId) {
    const form = document.getElementById(formId)
    let errorDiv = form.querySelector(".error-message")
  
    if (!errorDiv) {
      errorDiv = document.createElement("div")
      errorDiv.className = "error-message"
      form.querySelector(".auth-form").prepend(errorDiv)
    }
  
    errorDiv.textContent = message
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove()
      }
    }, 5000)
  }
  
  function showSuccess(message, formId) {
    const form = document.getElementById(formId)
    let successDiv = form.querySelector(".success-message")
  
    if (!successDiv) {
      successDiv = document.createElement("div")
      successDiv.className = "success-message"
      form.querySelector(".auth-form").prepend(successDiv)
    }
  
    successDiv.textContent = message
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.remove()
      }
    }, 5000)
  }
  
  function startOTPTimer() {
    timerCount = 60
    const timerElement = document.getElementById("timer")
    const resendBtn = document.getElementById("resendBtn")
  
    resendBtn.disabled = true
  
    otpTimer = setInterval(() => {
      timerCount--
      timerElement.textContent = timerCount
  
      if (timerCount <= 0) {
        clearInterval(otpTimer)
        resendBtn.disabled = false
        timerElement.parentElement.textContent = "Code expired. "
      }
    }, 1000)
  }
  
  function resendOTP() {
    // Dummy for now
    showSuccess("New verification code sent!", "otpForm")
  }
  
  function moveToNext(current, index) {
    if (current.value.length === 1 && index < 5) {
      const nextInput = document.querySelectorAll(".otp-input")[index + 1]
      if (nextInput) nextInput.focus()
    }
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    // Remember Me
    if (localStorage.getItem("rememberedUsername")) {
      document.getElementById("loginUsername").value = localStorage.getItem("rememberedUsername")
      document.getElementById("rememberMe").checked = true
    }
  
    document.getElementById("loginFormElement").addEventListener("submit", (e) => {
      e.preventDefault()
  
      const email = document.getElementById("loginUsername").value
      const password = document.getElementById("loginPassword").value
  
      if (!email || !password) {
        showError("Please fill in all fields", "loginForm")
        return
      }
  
      const rememberMe = document.getElementById("rememberMe").checked
      if (rememberMe) {
        localStorage.setItem("rememberedUsername", email)
      } else {
        localStorage.removeItem("rememberedUsername")
      }
  
      signInWithEmailAndPassword(auth, email, password)
        .then(() => {
          showSuccess("Login successful! Redirecting...", "loginForm")
        })
        .catch((err) => {
          showError(err.message, "loginForm")
        })
    })
  
    document.getElementById("registerFormElement").addEventListener("submit", (e) => {
      e.preventDefault()
  
      const name = document.getElementById("registerName").value
      const email = document.getElementById("registerEmail").value
      const phone = document.getElementById("registerPhone").value
      const password = document.getElementById("registerPassword").value
      const confirmPassword = document.getElementById("confirmPassword").value
  
      if (!name || !email || !phone || !password || !confirmPassword) {
        showError("Please fill in all fields", "registerForm")
        return
      }
  
      if (!isValidEmail(email)) {
        showError("Please enter a valid email address", "registerForm")
        return
      }
  
      if (password !== confirmPassword) {
        showError("Passwords do not match", "registerForm")
        return
      }
  
      if (checkPasswordStrength(password) < 3) {
        showError("Password is too weak.", "registerForm")
        return
      }
  
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const uid = userCredential.user.uid
          set(ref(db, 'admins/' + uid), { name, email, phone })
  
          window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', { size: 'invisible' }, auth)
          signInWithPhoneNumber(auth, phone, window.recaptchaVerifier)
            .then((result) => {
              confirmationResult = result
              document.getElementById("phoneDisplay").textContent = phone
              showForm("otpForm")
              startOTPTimer()
            })
            .catch((err) => {
              showError("OTP Send Failed: " + err.message, "registerForm")
            })
        })
        .catch((err) => {
          showError(err.message, "registerForm")
        })
    })
  
    document.getElementById("otpFormElement").addEventListener("submit", (e) => {
      e.preventDefault()
  
      const otp = Array.from(document.querySelectorAll(".otp-input"))
        .map((input) => input.value)
        .join("")
  
      if (otp.length !== 6) {
        showError("Please enter the complete 6-digit code", "otpForm")
        return
      }
  
      confirmationResult.confirm(otp)
        .then(() => {
          clearInterval(otpTimer)
          showForm("successForm")
        })
        .catch((err) => {
          showError("Invalid OTP: " + err.message, "otpForm")
        })
    })
  
    document.getElementById("forgotFormElement").addEventListener("submit", (e) => {
      e.preventDefault()
  
      const email = document.getElementById("forgotEmail").value
      if (!email) {
        showError("Please enter your email", "forgotForm")
        return
      }
  
      sendPasswordResetEmail(auth, email)
        .then(() => {
          showSuccess("Reset link sent!", "forgotForm")
        })
        .catch((err) => {
          showError(err.message, "forgotForm")
        })
    })
  
    document.getElementById("registerPassword").addEventListener("input", updatePasswordStrength)
  })
  