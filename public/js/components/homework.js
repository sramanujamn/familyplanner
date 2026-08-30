import { API } from '../api.js';

export async function renderHomework(container) {
  container.innerHTML = `
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Kids Homework & Projects</h2>
        <p class="text-xs text-slate-500">Assignments, tests, and submission statuses</p>
      </div>
      <button id="addHwBtn" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl">
        + Add Homework
      </button>
    </div>
    <div id="hwGrid" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="col-span-full py-8 text-center text-slate-400">Loading homework...</div>
    </div>
  `;

  document.getElementById('addHwBtn').addEventListener('click', promptAddHomework);
  await loadHomework();
}

async function loadHomework() {
  const grid = document.getElementById('hwGrid');
  try {
    const tasks = await API.getHomework();
    const todo = tasks.filter(t => t.status === 'todo');
    const inprogress = tasks.filter(t => t.status === 'inprogress');
    const done = tasks.filter(t => t.status === 'done');

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
  return tasks.map(t => `
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
      <div class="flex justify-between items-start">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">${t.member || 'Kids'}</span>
        <button class="delete-hw-btn text-slate-300 hover:text-rose-500" data-id="${t.id}"><i class="fa-regular fa-trash-can text-xs"></i></button>
      </div>
      <div class="font-bold text-slate-800 text-sm">${t.title}</div>
      <div class="text-xs text-slate-500 flex justify-between">
        <span>${t.subject || 'School'}</span>
        <span>Due ${t.due || 'Soon'}</span>
      </div>
      <div class="pt-2 flex justify-end gap-1">
        ${t.status !== 'todo' ? `<button class="move-hw-btn text-[10px] bg-slate-100 px-2 py-1 rounded" data-id="${t.id}" data-status="todo">To Do</button>` : ''}
        ${t.status !== 'inprogress' ? `<button class="move-hw-btn text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded" data-id="${t.id}" data-status="inprogress">In Progress</button>` : ''}
        ${t.status !== 'done' ? `<button class="move-hw-btn text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded" data-id="${t.id}" data-status="done">Done</button>` : ''}
      </div>
    </div>
  `).join('');
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
}

async function promptAddHomework() {
  const title = prompt("Assignment Title:");
  if (!title) return;
  const subject = prompt("Subject:", "General");
  const due = prompt("Due Date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);

  await API.createHomework({ title, subject, due, status: "todo" });
  loadHomework();
}
