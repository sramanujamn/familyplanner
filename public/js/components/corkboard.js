import { API } from '../api.js';

export async function renderCorkboard(container) {
  container.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Family Fridge Door Canvas</h2>
        <p class="text-xs text-slate-500">Pin sticky notes, shared shopping lists, pictures, and video clips</p>
      </div>
      <div class="flex gap-2">
        <button id="pinNoteBtn" class="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-2 rounded-xl">+ Pin Note</button>
        <button id="pinListBtn" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl">+ Shopping List</button>
        <button id="pinMediaBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl">+ Photo / Video</button>
      </div>
    </div>

    <div id="corkboardGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-6 bg-slate-200/60 rounded-3xl border border-slate-300 min-h-[400px]">
      <div class="col-span-full py-12 text-center text-slate-400">Loading fridge canvas...</div>
    </div>
  `;

  document.getElementById('pinNoteBtn').addEventListener('click', promptAddNote);
  document.getElementById('pinListBtn').addEventListener('click', promptAddList);
  document.getElementById('pinMediaBtn').addEventListener('click', promptAddMedia);

  await loadCorkboard();
}

async function loadCorkboard() {
  const grid = document.getElementById('corkboardGrid');
  try {
    const items = await API.getCorkboard();

    if (!items.length) {
      grid.innerHTML = `<div class="col-span-full py-16 text-center text-slate-400">The fridge door is empty. Pin a note or shopping list!</div>`;
      return;
    }

    grid.innerHTML = items.map(item => renderItemCard(item)).join('');
    bindItemEvents(items);
  } catch (err) {
    grid.innerHTML = `<div class="col-span-full text-center text-rose-500 text-xs">Error loading corkboard items.</div>`;
  }
}

function renderItemCard(item) {
  const colorStyles = {
    yellow: 'bg-amber-100 border-amber-300 text-amber-900',
    blue: 'bg-sky-100 border-sky-300 text-sky-900',
    green: 'bg-emerald-100 border-emerald-300 text-emerald-900',
    rose: 'bg-rose-100 border-rose-300 text-rose-900'
  }[item.color || 'yellow'];

  if (item.type === 'note') {
    return `
      <div class="relative ${colorStyles} border p-5 rounded-2xl shadow-md rotate-[-1deg] hover:rotate-0 transition-transform flex flex-col justify-between">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-rose-500 shadow-sm border-2 border-white"></div>
        <div>
          <h3 class="font-bold text-base mb-2">${item.title}</h3>
          <p class="text-xs whitespace-pre-wrap leading-relaxed">${item.content}</p>
        </div>
        <div class="mt-4 pt-2 border-t border-slate-900/10 flex justify-between items-center text-[11px] opacity-75">
          <span>- ${item.author}</span>
          <button class="delete-pin-btn text-rose-600 font-bold" data-id="${item.id}">Unpin</button>
        </div>
      </div>
    `;
  }

  if (item.type === 'list') {
    return `
      <div class="relative bg-white border border-slate-300 p-5 rounded-2xl shadow-md rotate-[1deg] hover:rotate-0 transition-transform">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500 shadow-sm border-2 border-white"></div>
        <h3 class="font-bold text-slate-900 text-base mb-3 border-b pb-1"><i class="fa-solid fa-cart-shopping text-emerald-600 mr-2"></i>${item.title}</h3>
        <div class="space-y-2 mb-4">
          ${(item.items || []).map((sub, idx) => `
            <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input type="checkbox" ${sub.done ? 'checked' : ''} data-id="${item.id}" data-idx="${idx}" class="list-check-input rounded text-emerald-600 w-4 h-4">
              <span class="${sub.done ? 'line-through text-slate-400' : ''}">${sub.text}</span>
            </label>
          `).join('')}
        </div>
        <div class="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
          <span>By ${item.author}</span>
          <button class="delete-pin-btn text-rose-500 font-semibold" data-id="${item.id}">Unpin</button>
        </div>
      </div>
    `;
  }

  if (item.type === 'photo' || item.type === 'video') {
    const embedHtml = item.type === 'video' && item.url.includes('youtube')
      ? `<iframe class="w-full h-36 rounded-xl mb-2" src="${getYouTubeEmbedUrl(item.url)}" frameborder="0" allowfullscreen></iframe>`
      : `<img src="${item.url}" class="w-full h-40 object-cover rounded-xl mb-2 border border-slate-200" alt="Pinned Photo" />`;

    return `
      <div class="relative bg-white border border-slate-300 p-3.5 rounded-2xl shadow-md rotate-[-1deg] hover:rotate-0 transition-transform">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-500 shadow-sm border-2 border-white"></div>
        ${embedHtml}
        <div class="px-1">
          <h4 class="font-bold text-xs text-slate-900 mb-1">${item.title}</h4>
          <div class="flex justify-between items-center text-[10px] text-slate-400">
            <span>By ${item.author}</span>
            <button class="delete-pin-btn text-rose-500 font-semibold" data-id="${item.id}">Unpin</button>
          </div>
        </div>
      </div>
    `;
  }
}

function bindItemEvents(items) {
  document.querySelectorAll('.delete-pin-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      await API.deleteCorkboardItem(e.currentTarget.dataset.id);
      loadCorkboard();
    });
  });

  document.querySelectorAll('.list-check-input').forEach(check => {
    check.addEventListener('change', async (e) => {
      const { id, idx } = e.currentTarget.dataset;
      const targetItem = items.find(i => i.id === id);
      if (targetItem && targetItem.items[idx]) {
        targetItem.items[idx].done = e.currentTarget.checked;
        await API.updateCorkboardList(id, targetItem.items);
        loadCorkboard();
      }
    });
  });
}

function getYouTubeEmbedUrl(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
}

async function promptAddNote() {
  const title = prompt("Note Header:");
  if (!title) return;
  const content = prompt("Message / Details:");
  const author = prompt("Your Name:", "Family");

  await API.createCorkboardItem({ type: 'note', title, content, author, color: 'yellow' });
  loadCorkboard();
}

async function promptAddList() {
  const title = prompt("List Name (e.g. Vraj Fresh Items):", "Shopping List");
  if (!title) return;
  const rawItems = prompt("Items (comma separated, e.g. Milk, Spinach):");
  if (!rawItems) return;

  const items = rawItems.split(',').map(text => ({ text: text.trim(), done: false })).filter(i => i.text);
  await API.createCorkboardItem({ type: 'list', title, items, author: 'Family' });
  loadCorkboard();
}

async function promptAddMedia() {
  const title = prompt("Media Title / Caption:");
  if (!title) return;
  const url = prompt("Image URL or YouTube Video Link:");
  if (!url) return;

  const type = url.includes('youtube') || url.includes('youtu.be') ? 'video' : 'photo';
  await API.createCorkboardItem({ type, title, url, author: 'Family' });
  loadCorkboard();
}
