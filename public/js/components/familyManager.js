// public/js/components/familyManager.js
import { API } from '../api.js';

let activeFamily = null;

export async function getOrPromptFamilyWorkspace() {
  const familyData = await API.getFamily();

  if (!familyData.hasFamily) {
    const choice = prompt(
      "Welcome to Family Connect Hub!\n\nType '1' to Create a new Family Workspace\nType '2' to Join an existing Family with a code", 
      "1"
    );

    if (choice === "2") {
      const joinCode = prompt("Enter your Family Join Code (e.g., NAIDU-7429):");
      const memberName = prompt("Enter your name (e.g. Raja, Amma, Krishna, Harini):");
      await API.joinFamily(joinCode, memberName);
    } else {
      const familyName = prompt("Enter a name for your Family Workspace:", "Naidu Family Workspace");
      const membersRaw = prompt("Enter initial family members (comma separated):", "Raja, Amma, Krishna, Harini");
      const initialMembers = membersRaw 
        ? membersRaw.split(',').map(m => m.trim()).filter(Boolean) 
        : ["Raja", "Amma", "Krishna", "Harini"];

      await API.createFamily(familyName, initialMembers);
    }

    return getOrPromptFamilyWorkspace();
  }

  activeFamily = familyData;
  renderFamilyHeaderBadge();
  return activeFamily;
}

function renderFamilyHeaderBadge() {
  const userDisplay = document.getElementById('userDisplay');
  if (userDisplay && activeFamily) {
    userDisplay.innerHTML = `
      <span class="font-bold text-slate-800">${activeFamily.name}</span>
      <span class="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded ml-1 border border-indigo-100 font-mono">Code: ${activeFamily.joinCode}</span>
      <button id="addMemberHeaderBtn" class="ml-2 text-indigo-600 hover:text-indigo-800 font-bold text-xs">+ Add Member</button>
    `;

    document.getElementById('addMemberHeaderBtn').addEventListener('click', async () => {
      const newName = prompt("Enter new family member name:");
      if (newName) {
        const res = await API.addFamilyMember(newName);
        if (res.success) {
          activeFamily.members = res.members;
          alert(`Added ${newName} to family members!`);
          location.reload();
        }
      }
    });
  }
}

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

// public/js/components/familyManager.js
export function renderUserProfileBadge(user) {
  const avatarImg = document.getElementById('userAvatar');
  if (avatarImg && user.photoURL) {
    avatarImg.src = user.photoURL;
    avatarImg.onclick = openProfileModal;
  }
}

export async function openProfileModal() {
  const overlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalFields = document.getElementById('modalFields');
  const modalForm = document.getElementById('modalForm');

  const profile = await API.getProfile();

  modalTitle.textContent = "User Profile & Picture";
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
  `;

  overlay.classList.remove('hidden');
  const closeModal = () => overlay.classList.add('hidden');
  document.getElementById('closeModalBtn').onclick = closeModal;
  document.getElementById('cancelModalBtn').onclick = closeModal;

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
