import { renderSchedules } from './components/schedule.js';
import { renderHomework } from './components/homework.js';
import { renderTrips } from './components/trips.js';
import { renderCorkboard } from './components/corkboard.js';
import { getOrPromptFamilyWorkspace } from './components/familyManager.js';
import { startPresencePolling } from './components/familyManager.js';
import { initForgotPasswordHandlers } from './components/familyManager.js';


const firebaseConfig = {
  apiKey: "AIzaSyA1CBPwmAlQSq2xKcZwqxjD3MBHDG6PHdo",
  authDomain: "familyplanner-826bf.firebaseapp.com",
  projectId: "familyplanner-826bf",
  storageBucket: "familyplanner-826bf.firebasestorage.app",
  messagingSenderId: "452092004562",
  appId: "1:452092004562:web:bf124f31986eee2202c50b",
  measurementId: "G-ZTSLHRD0ZR"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

let currentTab = 'schedules';

//document.addEventListener('DOMContentLoaded', () => {
//  initForgotPasswordHandlers();
//});


document.addEventListener('DOMContentLoaded', () => {
  const authOverlay = document.getElementById('authOverlay');
  const appContainer = document.getElementById('app');
  const loginForm = document.getElementById('loginForm');
  const authError = document.getElementById('authError');
  const lockBtn = document.getElementById('lockBtn');
  const navTabs = document.querySelectorAll('.nav-tab');

  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        if (authOverlay) authOverlay.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');

        await getOrPromptFamilyWorkspace();
        startPresencePolling(); // <-- START PRESENCE MONITORING
        loadTab(currentTab);
      } else {
      if (appContainer) appContainer.classList.add('hidden');
      if (authOverlay) authOverlay.classList.remove('hidden');
      }
    });
      
  }
  
  initForgotPasswordHandlers();

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value.trim();
      if (authError) authError.textContent = "";

      try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        loginForm.reset();
      } catch (err) {
        console.error("Auth error:", err);
        if (authError) authError.textContent = err.message || "Sign in failed";
      }
    });
  }

  if (lockBtn) {
    lockBtn.addEventListener('click', () => {
      if (typeof firebase !== 'undefined' && firebase.auth) firebase.auth().signOut();
    });
  }

  navTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      navTabs.forEach(t => {
        t.classList.remove('text-indigo-600', 'border-b-2', 'border-indigo-600', 'font-semibold');
        t.classList.add('text-slate-500', 'font-medium');
      });
      e.currentTarget.classList.remove('text-slate-500', 'font-medium');
      e.currentTarget.classList.add('text-indigo-600', 'border-b-2', 'border-indigo-600', 'font-semibold');

      currentTab = e.currentTarget.dataset.tab;
      loadTab(currentTab);
    });
  });
});

export function loadTab(tabName) {
  const container = document.getElementById('tabContent');
  if (!container) return;

  if (tabName === 'schedules') renderSchedules(container);
  if (tabName === 'homework') renderHomework(container);
  if (tabName === 'trips') renderTrips(container);
  if (tabName === 'corkboard') renderCorkboard(container);
}
