import { API } from '../api.js';
import { getFamilyMemberOptionsHtml } from './familyManager.js';

export async function renderSchedules(container) {
  container.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Family Master Schedule</h2>
        <p class="text-xs text-slate-500">Sync calls, appointments, and travel plans across family members</p>
      </div>
      <button id="addEventBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all self-start md:self-auto">
        <i class="fa-solid fa-plus"></i> New Event
      </button>
    </div>

    <!-- CALENDAR CONTAINER -->
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm mb-6">
      <div id="calendar" class="min-h-[450px] text-sm"></div>
    </div>

    <div class="mb-3">
      <h3 class="font-bold text-slate-800 text-sm">Upcoming Event Details</h3>
    </div>
    <div id="eventsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="col-span-full py-8 text-center text-slate-400">Loading events...</div>
    </div>
  `;

  document.getElementById('addEventBtn').addEventListener('click', openAddEventModal);
  await initScheduleView();
}

async function initScheduleView() {
  const grid = document.getElementById('eventsGrid');
  const calendarEl = document.getElementById('calendar');

  try {
    const events = await API.getEvents();

    // Initialize FullCalendar with custom color mapping per family member
    if (calendarEl && window.FullCalendar) {
      calendarEl.innerHTML = "";
      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek'
        },
        height: 'auto',
        events: (Array.isArray(events) ? events : []).map(ev => ({
          id: ev.id,
          title: `[${ev.member || 'Everyone'}] ${ev.title}`,
          start: ev.time ? `${ev.date}T${ev.time}` : ev.date,
          end: ev.endDate ? (ev.endTime ? `${ev.endDate}T${ev.endTime}` : ev.endDate) : undefined,
          backgroundColor: getMemberColor(ev.member),
          borderColor: getMemberColor(ev.member)
        }))
      });
      calendar.render();
    }

    if (!Array.isArray(events) || !events.length) {
      grid.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">No events scheduled.</div>`;
      return;
    }

    grid.innerHTML = events.map(ev => {
      const dateDisplay = (ev.endDate && ev.endDate !== ev.date) 
        ? `${ev.date} to ${ev.endDate}` 
        : ev.date;

      const timeDisplay = `${ev.time ? 'at ' + ev.time : ''} ${ev.endTime ? '- ' + ev.endTime : ''}`;

      return `
        <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex justify-between items-start">
              <span class="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                ${ev.member || 'Everyone'}
              </span>
              <button class="delete-event-btn text-slate-300 hover:text-rose-500 transition-colors" data-id="${ev.id}">
                <i class="fa-regular fa-trash-can text-xs"></i>
              </button>
            </div>

            <h3 class="font-bold text-slate-900 text-base leading-snug">${ev.title}</h3>

            <div class="text-xs text-slate-600 space-y-1">
              <div>
                <i class="fa-regular fa-calendar text-slate-400 mr-1.5"></i>
                ${dateDisplay} ${timeDisplay}
              </div>
              ${ev.location ? `<div><i class="fa-solid fa-location-dot text-slate-400 mr-1.5"></i> ${ev.location}</div>` : ''}
            </div>

            ${ev.notes ? `<p class="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">${ev.notes}</p>` : ''}
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.delete-event-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        await API.deleteEvent(e.currentTarget.dataset.id);
        renderSchedules(document.getElementById('tabContent'));
      });
    });
  } catch (err) {
    console.error("Calendar render error:", err);
    grid.innerHTML = `<div class="col-span-full text-center text-rose-500 text-xs py-4">Error loading schedule.</div>`;
  }
}

// Custom color palette for Raja, Amma, Krishna, and Harini
function getMemberColor(member) {
  switch (member) {
    case 'Raja': return '#2563eb';      // Blue
    case 'Amma': return '#e11d48';      // Rose / Red
    case 'Krishna': return '#059669';   // Emerald / Green
    case 'Harini': return '#d97706';    // Amber / Orange
    default: return '#4f46e5';         // Indigo (Everyone)
  }
}

function openAddEventModal() {
  const overlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalFields = document.getElementById('modalFields');

  modalTitle.textContent = "New Schedule Event";
  modalFields.innerHTML = `
    <div>
      <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Event Title *</label>
      <input type="text" id="evTitle" required placeholder="e.g. Flight to California" class="w-full text-xs p-2.5 border rounded-xl">
    </div>
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Family Member</label>
        <select id="evMember" class="w-full text-xs p-2.5 border rounded-xl">
          ${getFamilyMemberOptionsHtml()}
        </select>
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Location</label>
        <input type="text" id="evLocation" placeholder="Address or Zoom link" class="w-full text-xs p-2.5 border rounded-xl">
      </div>
    </div>
    
    <!-- START DATE & TIME -->
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Start Date *</label>
        <input type="date" id="evDate" required value="${new Date().toISOString().split('T')[0]}" class="w-full text-xs p-2.5 border rounded-xl">
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Start Time (Optional)</label>
        <input type="time" id="evTime" class="w-full text-xs p-2.5 border rounded-xl">
      </div>
    </div>

    <!-- END DATE & TIME -->
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">End Date (Optional)</label>
        <input type="date" id="evEndDate" class="w-full text-xs p-2.5 border rounded-xl">
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">End Time (Optional)</label>
        <input type="time" id="evEndTime" class="w-full text-xs p-2.5 border rounded-xl">
      </div>
    </div>
    
    <!-- NOTES FIELD -->
    <div>
      <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Description (Optional)</label>
      <textarea id="evNotes" rows="2" placeholder="Flight confirmation, packing items, or extra details..." class="w-full text-xs p-2.5 border rounded-xl"></textarea>
    </div>
  `;

  overlay.classList.remove('hidden');

  const closeModal = () => overlay.classList.add('hidden');
  document.getElementById('closeModalBtn').onclick = closeModal;
  document.getElementById('cancelModalBtn').onclick = closeModal;

  modalForm.onsubmit = async (e) => {
    e.preventDefault();

    const title = document.getElementById('evTitle').value;
    const date = document.getElementById('evDate').value;
    const time = document.getElementById('evTime').value;
    const endDate = document.getElementById('evEndDate').value;
    const endTime = document.getElementById('evEndTime').value;
    const member = document.getElementById('evMember').value;
    const location = document.getElementById('evLocation').value;
    const notes = document.getElementById('evNotes').value;

    try {
      await API.createEvent({ title, date, time, endDate, endTime, member, location, notes });
      closeModal();
      renderSchedules(document.getElementById('tabContent'));
    } catch (err) {
      console.error("Failed to add event:", err);
      alert("Error saving event.");
    }
  };
}
