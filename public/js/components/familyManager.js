// public/js/components/familyManager.js
import { API } from '../api.js';

let activeFamily = null;

export async function getOrPromptFamilyWorkspace() {
  const familyData = await API.getFamily();

  if (!familyData.hasFamily) {
    return new Promise((resolve) => {
      openWorkspaceModal(resolve);
    });
  }

  activeFamily = familyData;
  initProfileDropdown();
  renderFamilyHeaderBadge();
  return activeFamily;
}

export function initProfileDropdown() {
  const avatarImg = document.getElementById('userAvatar');
  const dropdown = document.getElementById('profileDropdown');

  if (!avatarImg || !dropdown) return;

  // Toggle dropdown menu on avatar click
  avatarImg.onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
    populateDropdownHeader();
  };

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== avatarImg) {
      dropdown.classList.add('hidden');
    }
  });

  // Menu item click handlers
  const editBtn = document.getElementById('menuEditProfileBtn');
  if (editBtn) {
    editBtn.onclick = () => {
      dropdown.classList.add('hidden');
      openProfileModal();
    };
  }

  const wsBtn = document.getElementById('menuWorkspaceSettingsBtn');
  if (wsBtn) {
    wsBtn.onclick = () => {
      dropdown.classList.add('hidden');
      openWorkspaceSettingsModal();
    };
  }

  const signOutBtn = document.getElementById('menuSignOutBtn');
  if (signOutBtn) {
    signOutBtn.onclick = () => {
      dropdown.classList.add('hidden');
      if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut();
      }
    };
  }
}

async function populateDropdownHeader() {
  try {
    const profile = await API.getProfile();
    const nicknameEl = document.getElementById('menuUserNickname');
    const emailEl = document.getElementById('menuUserEmail');
    const avatarImg = document.getElementById('userAvatar');

    if (nicknameEl) nicknameEl.textContent = profile.nickname || 'User';
    if (emailEl) emailEl.textContent = profile.email || '';
    if (avatarImg && profile.photoURL) avatarImg.src = profile.photoURL;
  } catch (err) {
    console.warn("Non-blocking profile load warning:", err);
  }
}

export async function openProfileModal() {
  const overlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalFields = document.getElementById('modalFields');
  const modalForm = document.getElementById('modalForm');

  const profile = await API.getProfile();

  modalTitle.textContent = "Edit User Profile & Settings";
  modalFields.innerHTML = `
    <div class="flex justify-center mb-3">
      <img src="${profile.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=default'}" class="w-20 h-20 rounded-full border-2 border-indigo-600 object-cover shadow">
    </div>
    <div>
      <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Profile Picture URL</label>
      <input type="url" id="pfPhotoURL" value="${profile.photoURL || ''}" placeholder="https://example.com/photo.jpg" class="w-full text-xs p-2.5 border rounded-xl">
    </div>
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">First Name</label>
        <input type="text" id="pfFirstName" value="${profile.firstName || ''}" class="w-full text-xs p-2.5 border rounded-xl">
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Last Name</label>
        <input type="text" id="pfLastName" value="${profile.lastName || ''}" class="w-full text-xs p-2.5 border rounded-xl">
      </div>
    </div>
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Nickname (Display)</label>
        <input type="text" id="pfNickname" value="${profile.nickname || ''}" required class="w-full text-xs p-2.5 border rounded-xl">
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Date of Birth</label>
        <input type="date" id="pfDob" value="${profile.dob || ''}" class="w-full text-xs p-2.5 border rounded-xl">
      </div>
    </div>
    <div>
      <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
      <input type="tel" id="pfPhone" value="${profile.phone || ''}" placeholder="+1-201-555-0199" class="w-full text-xs p-2.5 border rounded-xl">
    </div>

    <!-- Security & Password Reset Action -->
    <div class="pt-3 border-t">
      <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Account Security</label>
      <button type="button" id="sendResetFromProfileBtn" class="w-full py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition-colors">
        <i class="fa-solid fa-key mr-1.5"></i> Send Password Reset Email
      </button>
      <p id="profileResetFeedback" class="text-[10px] text-emerald-600 mt-1 hidden text-center font-semibold"></p>
    </div>
  `;

  overlay.classList.remove('hidden');
  const closeModal = () => overlay.classList.add('hidden');
  document.getElementById('closeModalBtn').onclick = closeModal;
  document.getElementById('cancelModalBtn').onclick = closeModal;

  // Handle direct reset button inside logged-in profile modal
  document.getElementById('sendResetFromProfileBtn').onclick = async () => {
    const feedback = document.getElementById('profileResetFeedback');
    const user = firebase.auth().currentUser;
    if (user && user.email) {
      try {
        await firebase.auth().sendPasswordResetEmail(user.email);
        feedback.textContent = `✅ Password reset email sent to ${user.email}`;
        feedback.classList.remove('hidden');
      } catch (err) {
        feedback.textContent = `❌ ${err.message}`;
        feedback.className = "text-[10px] text-rose-600 mt-1 text-center font-semibold";
        feedback.classList.remove('hidden');
      }
    }
  };

  modalForm.onsubmit = async (e) => {
    e.preventDefault();
    await API.updateProfile({
      photoURL: document.getElementById('pfPhotoURL').value,
      firstName: document.getElementById('pfFirstName').value,
      lastName: document.getElementById('pfLastName').value,
      nickname: document.getElementById('pfNickname').value,
      dob: document.getElementById('pfDob').value,
      phone: document.getElementById('pfPhone').value
    });
    closeModal();
    location.reload();
  };
}

export function openWorkspaceSettingsModal() {
  const overlay = document.getElementById('workspaceSettingsModalOverlay');
  const joinCodeEl = document.getElementById('wsSettingJoinCode');
  const copyBtn = document.getElementById('copyJoinCodeBtn');
  const rosterContainer = document.getElementById('wsSettingsRosterList');
  const closeBtn = document.getElementById('closeWsSettingsModalBtn');
  const doneBtn = document.getElementById('doneWsSettingsBtn');
  const addMemberBtn = document.getElementById('wsAddMemberModalBtn');

  if (!activeFamily) return;

  joinCodeEl.textContent = activeFamily.joinCode || 'N/A';
  
  rosterContainer.innerHTML = (activeFamily.members || []).map(m => `
    <span class="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 shadow-sm">
      <i class="fa-solid fa-user-tag text-indigo-400 mr-1.5 text-[10px]"></i> ${m}
    </span>
  `).join('');

  copyBtn.onclick = () => {
    navigator.clipboard.writeText(activeFamily.joinCode);
    copyBtn.textContent = "Copied!";
    setTimeout(() => { copyBtn.textContent = "Copy Code"; }, 2000);
  };

  overlay.classList.remove('hidden');
  const closeModal = () => overlay.classList.add('hidden');

  closeBtn.onclick = closeModal;
  doneBtn.onclick = closeModal;
  addMemberBtn.onclick = () => {
    closeModal();
    openAddMemberModal();
  };
}

function openWorkspaceModal(onSuccessCallback) {
  const overlay = document.getElementById('workspaceModalOverlay');
  const tabCreate = document.getElementById('tabCreateMode');
  const tabJoin = document.getElementById('tabJoinMode');
  const createForm = document.getElementById('createWorkspaceForm');
  const joinForm = document.getElementById('joinWorkspaceForm');
  const closeBtn = document.getElementById('closeWorkspaceModalBtn');

  if (!overlay) return;

  overlay.classList.remove('hidden');

  tabCreate.onclick = () => {
    tabCreate.className = "flex-1 py-2 rounded-lg bg-white text-indigo-600 shadow-sm transition-all";
    tabJoin.className = "flex-1 py-2 rounded-lg text-slate-500 hover:text-slate-700 transition-all";
    createForm.classList.remove('hidden');
    joinForm.classList.add('hidden');
  };

  tabJoin.onclick = () => {
    tabJoin.className = "flex-1 py-2 rounded-lg bg-white text-indigo-600 shadow-sm transition-all";
    tabCreate.className = "flex-1 py-2 rounded-lg text-slate-500 hover:text-slate-700 transition-all";
    joinForm.classList.remove('hidden');
    createForm.classList.add('hidden');
  };

  closeBtn.onclick = () => overlay.classList.add('hidden');

  createForm.onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('wsName').value.trim();
    const rawMembers = document.getElementById('wsMembers').value;
    const initialMembers = rawMembers ? rawMembers.split(',').map(m => m.trim()).filter(Boolean) : ["Raja", "Amma", "Krishna", "Harini"];

    const res = await API.createFamily(name, initialMembers);
    if (res.success) {
      overlay.classList.add('hidden');
      const updatedFamily = await API.getFamily();
      activeFamily = updatedFamily;
      renderFamilyHeaderBadge();
      onSuccessCallback(activeFamily);
    }
  };

  joinForm.onsubmit = async (e) => {
    e.preventDefault();
    const joinCode = document.getElementById('wsJoinCode').value.trim();
    const memberName = document.getElementById('wsMemberName').value.trim();

    try {
      const res = await API.joinFamily(joinCode, memberName);
      if (res.success) {
        overlay.classList.add('hidden');
        const updatedFamily = await API.getFamily();
        activeFamily = updatedFamily;
        renderFamilyHeaderBadge();
        onSuccessCallback(activeFamily);
      }
    } catch (err) {
      alert("Invalid Join Code. Please check and try again.");
    }
  };
}

function openAddMemberModal() {
  const overlay = document.getElementById('addMemberModalOverlay');
  const form = document.getElementById('addMemberForm');
  const closeBtn = document.getElementById('closeAddMemberModalBtn');
  const cancelBtn = document.getElementById('cancelAddMemberBtn');

  if (!overlay) return;

  overlay.classList.remove('hidden');
  const closeModal = () => overlay.classList.add('hidden');

  closeBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const newName = document.getElementById('newMemberNameInput').value.trim();
    if (newName) {
      const res = await API.addFamilyMember(newName);
      if (res.success) {
        activeFamily.members = res.members;
        closeModal();
        location.reload();
      }
    }
  };
}

function renderFamilyHeaderBadge() {
  const userDisplay = document.getElementById('userDisplay');
  if (userDisplay && activeFamily) {
    userDisplay.innerHTML = `
      <span class="font-bold text-slate-800">${activeFamily.name}</span>
      <span class="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded ml-1 border border-indigo-100 font-mono">Code: ${activeFamily.joinCode}</span>
    `;
  }
}

// REQUIRED EXPORT FOR SCHEDULE.JS & HOMEWORK.JS FORM DROPDOWNS
export function getFamilyMemberOptionsHtml(selectedMember = 'Everyone') {
  const members = activeFamily && activeFamily.members && activeFamily.members.length 
    ? activeFamily.members 
    : ["Raja", "Amma", "Krishna", "Harini"];

  let html = `<option value="Everyone" ${selectedMember === 'Everyone' ? 'selected' : ''}>Everyone</option>`;
  members.forEach(m => {
    html += `<option value="${m}" ${selectedMember === m ? 'selected' : ''}>${m}</option>`;
  });
  return html;
}

// Live Presence Roster Rendering
export async function renderFamilyPresenceRoster() {
  const rosterContainer = document.getElementById('familyPresenceRoster');
  if (!rosterContainer) return;

  try {
    // 1. Send heartbeat ping for active user
    await API.updatePresence();

    // 2. Fetch all registered family users from Firestore
    const users = await API.getFamilyUsers();

    if (!Array.isArray(users) || !users.length) {
      rosterContainer.innerHTML = '';
      return;
    }

    const now = new Date().getTime();
    const ONLINE_THRESHOLD_MS = 3 * 60 * 1000; // Active within last 3 minutes = Online

    rosterContainer.innerHTML = users.map(user => {
      const lastActiveTime = user.lastActive ? new Date(user.lastActive).getTime() : 0;
      const isOnline = (now - lastActiveTime) < ONLINE_THRESHOLD_MS;
      
      // FIX: Check nickname, firstName, or fallback to email handle
      const displayName = user.nickname || user.firstName || (user.email ? user.email.split('@')[0] : 'User');
      const avatarSrc = user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${displayName}`;

      return `
        <div class="relative group cursor-pointer" title="${displayName} (${isOnline ? 'Online' : 'Offline'})">
          <img src="${avatarSrc}" 
               alt="${displayName}" 
               class="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover bg-slate-100 shadow-sm" />
          
          <!-- Real-Time Online / Offline Indicator Dot -->
          <span class="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
          
          <!-- Tooltip on Hover showing actual Nickname -->
          <div class="absolute bottom-full mb-1 right-1/2 translate-x-1/2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
            <span class="bg-slate-900 text-white text-[10px] font-semibold py-1 px-2 rounded-lg whitespace-nowrap shadow-md">
              ${displayName} ${isOnline ? '🟢 Online' : '⚪ Offline'}
            </span>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.warn("Presence roster update error:", err);
  }
}

// Automatically start periodic presence heartbeats & roster refreshes
export function startPresencePolling() {
  renderFamilyPresenceRoster();
  // Refresh presence state every 60 seconds
  setInterval(renderFamilyPresenceRoster, 60000);
}

/**
 * Initializes Forgot Password modal event listeners for the login screen.
 */
export function initForgotPasswordHandlers() {
  const forgotBtn = document.getElementById('forgotPasswordBtn');
  const overlay = document.getElementById('forgotPasswordModalOverlay');
  const closeBtn = document.getElementById('closeForgotPasswordModalBtn');
  const cancelBtn = document.getElementById('cancelResetBtn');
  const form = document.getElementById('forgotPasswordForm');
  const feedbackMsg = document.getElementById('resetFeedbackMsg');

  if (!forgotBtn || !overlay) return;

  const closeModal = () => {
    overlay.classList.add('hidden');
    feedbackMsg.classList.add('hidden');
    form.reset();
  };

  forgotBtn.onclick = () => {
    overlay.classList.remove('hidden');
    const loginEmailInput = document.getElementById('loginEmail');
    if (loginEmailInput && loginEmailInput.value) {
      document.getElementById('resetEmailInput').value = loginEmailInput.value;
    }
  };

  closeBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('resetEmailInput').value.trim();

    try {
      await firebase.auth().sendPasswordResetEmail(email);
      feedbackMsg.className = "text-xs p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200";
      feedbackMsg.textContent = "✅ Reset link sent! Check your inbox.";
      feedbackMsg.classList.remove('hidden');
      setTimeout(closeModal, 3000);
    } catch (err) {
      feedbackMsg.className = "text-xs p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200";
      feedbackMsg.textContent = `❌ ${err.message}`;
      feedbackMsg.classList.remove('hidden');
    }
  };
}
