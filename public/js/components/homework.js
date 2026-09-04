import { API } from '../api.js';
import { getFamilyMemberOptionsHtml } from './familyManager.js';

export async function renderHomework(container) {
  container.innerHTML = `
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Kids Homework & Projects</h2>
        <p class="text-xs text-slate-500">Assignments, tests, and submission statuses</p>
      </div>
      
      <button id="viewHwHistoryBtn" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <i class="fa-solid fa-clock-rotate-left mr-1"></i> View History
        </button>
      
      <button id="addHwBtn" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl">
        + Add Homework
      </button>
    </div>
    
    <!-- REWARD POINTS SCOREBOARD -->
    <div id="rewardScoreboard" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"></div>
    
    <div id="hwGrid" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="col-span-full py-8 text-center text-slate-400">Loading homework...</div>
    </div>
    
    <!-- HISTORY MODAL -->
    <div id="hwHistoryModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm hidden flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
        <div class="flex justify-between items-center border-b pb-3">
          <h3 class="text-lg font-bold text-slate-900">Completed & Verified Homework History</h3>
          <button id="closeHwHistoryBtn" class="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
        </div>
        <div id="hwHistoryList" class="overflow-y-auto space-y-3 pr-1 flex-grow"></div>
      </div>
    </div>
  `;

  document.getElementById('addHwBtn').addEventListener('click', openAddHomeworkModal);  
  document.getElementById('viewHwHistoryBtn').addEventListener('click', openHomeworkHistoryModal);
  document.getElementById('closeHwHistoryBtn').onclick = () => document.getElementById('hwHistoryModal').classList.add('hidden');
  
  await loadHomework();
}

async function loadHomework() {
  const grid = document.getElementById('hwGrid');
  const scoreboard = document.getElementById('rewardScoreboard');

  try {
    const tasks = await API.getHomework();
    const taskList = Array.isArray(tasks) ? tasks : [];
    const todo = tasks.filter(t => t.status === 'todo');
    const inprogress = tasks.filter(t => t.status === 'inprogress');
    const done = tasks.filter(t => t.status === 'done');

    
    const pointsMap = {};
    taskList.forEach(t => {
      if (t.verified || t.status === 'done') {
        const member = t.member || 'Kids';
        const rating = parseInt(t.rating || 5, 10);
        pointsMap[member] = (pointsMap[member] || 0) + (rating * 10);
      }
    });
    
    console.log('Reached here inside loadHomework().');
    
    // Render Scoreboard
    const members = Object.keys(pointsMap);
    if (members.length) {
      scoreboard.innerHTML = members.map(m => `
        <div class="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">⭐</div>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-amber-800">${m}</p>
            <p class="text-lg font-black text-amber-950">${pointsMap[m]} <span class="text-xs font-medium text-amber-700">Pts</span></p>
          </div>
        </div>
      `).join('');
    } else {
      scoreboard.innerHTML = `
        <div class="col-span-full bg-slate-100/60 p-3 rounded-2xl text-center text-xs text-slate-400 border border-slate-200/60">
          ⭐ Verified homework with ratings will earn reward points here!
        </div>`;
    }

    grid.innerHTML = `
      <div class="bg-slate-100/80 p-4 rounded-2xl border border-slate-200">
        <h3 class="font-bold text-slate-700 text-sm mb-3">To Do (${todo.length})</h3>
        <div class="space-y-3">${renderTaskList(todo)}</div>
      </div>
      <div class="bg-slate-100/80 p-4 rounded-2xl border border-slate-200">
        <h3 class="font-bold text-slate-700 text-sm mb-3">In Progress (${inprogress.length})</h3>
        <div class="space-y-3">${renderTaskList(inprogress)}</div>
      </div>
      <div class="bg-slate-100/80 p-4 rounded-2xl border border-slate-200">
        <h3 class="font-bold text-slate-700 text-sm mb-3">Completed (${done.length})</h3>
        <div class="space-y-3">${renderTaskList(done)}</div>
      </div>
    `;

    bindHomeworkEvents();
  } catch (err) {
    grid.innerHTML = `<div class="col-span-full text-center text-rose-500 text-xs">Error loading homework.</div>`;
  }
}

function renderTaskList(tasks) {
  if (!tasks.length) return `<div class="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">No tasks</div>`;
  
  return tasks.map(t => {
    const isCompleted = t.completed || t.status === 'done';
    const isVerified = t.verified || false;
    const currentRating = t.rating || 0;

    return `
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <!-- Card Header -->
        <div class="flex justify-between items-start">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
            ${t.member || 'Kids'}
          </span>
          <button class="delete-hw-btn text-slate-300 hover:text-rose-500 transition-colors" data-id="${t.id}">
            <i class="fa-regular fa-trash-can text-xs"></i>
          </button>
        </div>

        <!-- Title & Subject -->
        <div>
          <div class="font-bold text-slate-800 text-sm">${t.title}</div>
          <div class="text-xs text-slate-500 flex justify-between mt-1">
            <span class="font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">${t.subject || 'General'}</span>
            <span>Due ${t.due || 'Soon'}</span>
          </div>
        </div>

        <!-- Gamified Status Checkboxes -->
        <div class="pt-2 border-t border-slate-100 space-y-2 text-xs">
          <!-- Child Completed Check -->
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" class="toggle-completed-chk rounded text-emerald-600" data-id="${t.id}" ${isCompleted ? 'checked' : ''}>
            <span class="${isCompleted ? 'line-through text-slate-400' : 'font-semibold text-slate-700'}">
              ${isCompleted ? '✅ Child Completed' : 'Mark as Completed (Child)'}
            </span>
          </label>

          <!-- Parent Verified Check -->
          <label class="flex items-center gap-2 cursor-pointer select-none ${!isCompleted ? 'opacity-50 pointer-events-none' : ''}">
            <input type="checkbox" class="toggle-verified-chk rounded text-indigo-600" data-id="${t.id}" ${isVerified ? 'checked' : ''} ${!isCompleted ? 'disabled' : ''}>
            <span class="${isVerified ? 'font-bold text-indigo-700' : 'text-slate-600'}">
              ${isVerified ? '🛡️ Parent Verified' : 'Verify Homework (Parent)'}
            </span>
          </label>
        </div>

        <!-- Parent Star Rating (1-5 Stars) & Rewards -->
        ${isVerified ? `
          <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase mr-1">Rating:</span>
              ${[1, 2, 3, 4, 5].map(star => `
                <button class="rate-hw-btn text-xs ${star <= currentRating ? 'text-amber-400' : 'text-slate-200'} hover:text-amber-400 transition-colors" data-id="${t.id}" data-rating="${star}">
                  ★
                </button>
              `).join('')}
            </div>
            <span class="text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              +${currentRating * 10} pts 🌟
            </span>
          </div>
        ` : ''}
      </div>
      
      <div class="pt-2 flex justify-end gap-1">
        ${t.status !== 'todo' ? `<button class="move-hw-btn text-[10px] bg-slate-100 px-2 py-1 rounded" data-id="${t.id}" data-status="todo">To Do</button>` : ''}
        ${t.status !== 'inprogress' ? `<button class="move-hw-btn text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded" data-id="${t.id}" data-status="inprogress">In Progress</button>` : ''}
        ${t.status !== 'done' ? `<button class="move-hw-btn text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded" data-id="${t.id}" data-status="done">Done</button>` : ''}
      </div>
      
    `;
  }).join('');
}

function bindHomeworkEvents() {
  document.querySelectorAll('.delete-hw-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      await API.deleteHomework(e.currentTarget.dataset.id);
      loadHomework();
    });
  });

  document.querySelectorAll('.move-hw-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      await API.updateHomeworkStatus(e.currentTarget.dataset.id, e.currentTarget.dataset.status);
      loadHomework();
    });
  });
  
  // Toggle Completed (Child)
  document.querySelectorAll('.toggle-completed-chk').forEach(chk => {
    chk.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const completed = e.target.checked;
      const status = completed ? 'inprogress' : 'todo';

      await API.updateHomework(id, { completed, verified: false, status });
      loadHomework();
    });
  });

  // Toggle Verified (Parent)
  document.querySelectorAll('.toggle-verified-chk').forEach(chk => {
  chk.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const verified = e.target.checked;
      const cardContainer = e.target.closest('.bg-white');
      const ratingSelect = cardContainer ? cardContainer.querySelector('.parent-rating-select') : null;
      const rating = ratingSelect ? parseInt(ratingSelect.value, 10) : 5;

      try {
        await API.updateHomework(id, { 
          completed: true, 
          verified: verified, 
          rating: rating, 
          status: verified ? 'done' : 'inprogress' 
        });
        await loadHomework();
      } catch (err) {
        console.error("Failed to update verification status:", err);
        e.target.checked = !verified; // Revert checkbox if API call fails
      }
    })
  });

  // Star Rating (Parent)
  document.querySelectorAll('.rate-hw-btn').forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.currentTarget.dataset.id;
      const rating = parseInt(e.currentTarget.dataset.rating, 10);
      const rewardPoints = rating * 10; // 10 points per star
      await API.updateHomework(id, { rating, rewardPoints });
      loadHomework();
    };
  });
}

async function openAddHomeworkModal() {
const overlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalFields = document.getElementById('modalFields');
  const modalForm = document.getElementById('modalForm');

  modalTitle.textContent = "New Homework Assignment";
  modalFields.innerHTML = `
  <div>
    <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Assignment Title *</label>
    <input type="text" id="hwTitle" required placeholder="e.g. Chapter 4 Math Exercises" class="w-full text-xs p-2.5 border rounded-xl">
  </div>
  <div class="grid grid-cols-2 gap-2">
    <div>
      <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Subject *</label>
      <input type="text" id="hwSubject" required placeholder="e.g. Math, Science, Reading" class="w-full text-xs p-2.5 border rounded-xl">
    </div>
    <div>
      <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Student *</label>
      <select id="hwMember" class="w-full text-xs p-2.5 border rounded-xl">
        ${getFamilyMemberOptionsHtml()}
      </select>
    </div>
  </div>
  <div>
    <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Due Date *</label>
    <input type="date" id="hwDueDate" required value="${new Date().toISOString().split('T')[0]}" class="w-full text-xs p-2.5 border rounded-xl">
  </div>
  `;

  overlay.classList.remove('hidden');

  const closeModal = () => overlay.classList.add('hidden');
  document.getElementById('closeModalBtn').onclick = closeModal;
  document.getElementById('cancelModalBtn').onclick = closeModal;

  modalForm.onsubmit = async (e) => {
    e.preventDefault();

    const title = document.getElementById('hwTitle').value;
    const subject = document.getElementById('hwSubject').value;
    const member = document.getElementById('hwMember').value;
    const due = document.getElementById('hwDueDate').value;

    try {
      await API.createHomework({
        title,
        subject,
        member,
        due,
        completed: false,   // Child marks this
        verified: false,    // Parent marks this
        rating: 0,          // Parent rating (1-5 stars)
        rewardPoints: 0     // Calculated reward points
      });
      closeModal();
      loadHomework();
    } catch (err) {
      console.error("Failed to add homework:", err);
      alert("Error saving assignment.");
    }
  };
}

async function openHomeworkHistoryModal() {
  const modal = document.getElementById('hwHistoryModal');
  const historyList = document.getElementById('hwHistoryList');

  try {
    const tasks = await API.getHomework();
    const verifiedTasks = (Array.isArray(tasks) ? tasks : []).filter(t => t.verified || t.status === 'done');

    if (!verifiedTasks.length) {
      historyList.innerHTML = `<div class="text-center py-8 text-xs text-slate-400">No verified homework history found yet.</div>`;
    } else {
      historyList.innerHTML = verifiedTasks.map(t => {
        const stars = '★'.repeat(parseInt(t.rating || 5, 10)) + '☆'.repeat(5 - parseInt(t.rating || 5, 10));
        const pts = parseInt(t.rating || 5, 10) * 10;

        return `
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex justify-between items-center">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">${t.member || 'Kids'}</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">${t.subject || 'General'}</span>
              </div>
              <h4 class="font-bold text-slate-900 text-sm">${t.title}</h4>
              <p class="text-[11px] text-slate-500 mt-0.5"><i class="fa-regular fa-calendar text-slate-400 mr-1"></i> Due: ${t.due || 'N/A'}</p>
            </div>
            <div class="text-right">
              <div class="text-amber-500 text-xs font-bold">${stars}</div>
              <div class="text-xs font-extrabold text-emerald-600 mt-0.5">+${pts} Pts Earned</div>
            </div>
          </div>
        `;
      }).join('');
    }

    modal.classList.remove('hidden');
  } catch (err) {
    console.error("Failed to load history:", err);
  }
}
