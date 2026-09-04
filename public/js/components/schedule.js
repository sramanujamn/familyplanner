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

  document.getElementById('addEventBtn').addEventListener('click', () => openEventModal());
  await initScheduleView();
}

async function initScheduleView() {
  const grid = document.getElementById('eventsGrid');
  const calendarEl = document.getElementById('calendar');

  try {
    const events = await API.getEvents();
    const eventList = Array.isArray(events) ? events : [];

    // Initialize FullCalendar with click-to-edit support
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
        events: eventList.map(ev => ({
          id: ev.id,
          title: `[${ev.member || 'Everyone'}] ${ev.title}`,
          start: ev.time ? `${ev.date}T${ev.time}` : ev.date,
          end: ev.endDate ? (ev.endTime ? `${ev.endDate}T${ev.endTime}` : ev.endDate) : undefined,
          backgroundColor: getMemberColor(ev.member),
          borderColor: getMemberColor(ev.member),
          extendedProps: { ...ev } // Pass raw object properties for easy retrieval on click
        })),
        // Click on calendar item to edit
        eventClick: (info) => {
          const rawData = info.event.extendedProps;
          openEventModal({
            id: info.event.id,
            title: rawData.title || '',
            member: rawData.member || 'Everyone',
            location: rawData.location || '',
            date: rawData.date || info.event.startStr.split('T')[0],
            time: rawData.time || '',
            endDate: rawData.endDate || '',
            endTime: rawData.endTime || '',
            notes: rawData.notes || ''
          });
        }
      });
      calendar.render();
    }

    if (!eventList.length) {
      grid.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">No events scheduled.</div>`;
      return;
    }

    grid.innerHTML = eventList.map(ev => {
      const dateDisplay = (ev.endDate && ev.endDate !== ev.date) 
        ? `${ev.date} to ${ev.endDate}` 
        : ev.date;

      const timeDisplay = `${ev.time ? 'at ' + ev.time : ''} ${ev.endTime ? '- ' + ev.endTime : ''}`;

      return `
        <div class="event-card bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between cursor-pointer hover:border-indigo-200 transition-all" data-id="${ev.id}">
          <div class="space-y-3">
            <div class="flex justify-between items-start">
              <span class="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                ${ev.member || 'Everyone'}
              </span>
              <button class="delete-event-btn text-slate-300 hover:text-rose-500 transition-colors p-1" data-id="${ev.id}">
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

    // Card click event listener for editing from grid
    grid.querySelectorAll('.event-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.delete-event-btn')) return;
        const ev = eventList.find(item => item.id === card.dataset.id);
        if (ev) openEventModal(ev);
      });
    });

    // Delete button click handler
    grid.querySelectorAll('.delete-event-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await API.deleteEvent(e.currentTarget.dataset.id);
        renderSchedules(document.getElementById('tabContent'));
      });
    });
  } catch (err) {
    console.error("Calendar render error:", err);
    grid.innerHTML = `<div class="col-span-full text-center text-rose-500 text-xs py-4">Error loading schedule.</div>`;
  }
}

function getMemberColor(member) {
  switch (member) {
    case 'Raja': return '#2563eb';
    case 'Amma': return '#e11d48';
    case 'Krishna': return '#059669';
    case 'Harini': return '#d97706';
    default: return '#4f46e5';
  }
}

function openEventModal(eventToEdit = null) {
  const overlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalFields = document.getElementById('modalFields');
  const modalForm = document.getElementById('modalForm');

  modalTitle.textContent = eventToEdit ? "Edit Schedule Event" : "New Schedule Event";
  
  modalFields.innerHTML = `
    <input type="hidden" id="evId" value="${eventToEdit ? eventToEdit.id : ''}">
    <div>
      <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Event Title *</label>
      <input type="text" id="evTitle" required value="${eventToEdit ? eventToEdit.title : ''}" placeholder="e.g. Flight to California" class="w-full text-xs p-2.5 border rounded-xl">
    </div>
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Family Member</label>
        <select id="evMember" class="w-full text-xs p-2.5 border rounded-xl">
          ${getFamilyMemberOptionsHtml(eventToEdit ? eventToEdit.member : null)}
        </select>
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Location</label>
        <input type="text" id="evLocation" value="${eventToEdit && eventToEdit.location ? eventToEdit.location : ''}" placeholder="Address or Zoom link" class="w-full text-xs p-2.5 border rounded-xl">
      </div>
    </div>
    
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Start Date *</label>
        <input type="date" id="evDate" required value="${eventToEdit ? eventToEdit.date : new Date().toISOString().split('T')[0]}" class="w-full text-xs p-2.5 border rounded-xl">
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Start Time (Optional)</label>
        <input type="time" id="evTime" value="${eventToEdit && eventToEdit.time ? eventToEdit.time : ''}" class="w-full text-xs p-2.5 border rounded-xl">
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">End Date (Optional)</label>
        <input type="date" id="evEndDate" value="${eventToEdit && eventToEdit.endDate ? eventToEdit.endDate : ''}" class="w-full text-xs p-2.5 border rounded-xl">
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">End Time (Optional)</label>
        <input type="time" id="evEndTime" value="${eventToEdit && eventToEdit.endTime ? eventToEdit.endTime : ''}" class="w-full text-xs p-2.5 border rounded-xl">
      </div>
    </div>
    
    <div>
      <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Description (Optional)</label>
      <textarea id="evNotes" rows="2" placeholder="Flight confirmation, packing items, or extra details..." class="w-full text-xs p-2.5 border rounded-xl">${eventToEdit && eventToEdit.notes ? eventToEdit.notes : ''}</textarea>
    </div>
  `;

  overlay.classList.remove('hidden');

  const closeModal = () => overlay.classList.add('hidden');
  document.getElementById('closeModalBtn').onclick = closeModal;
  document.getElementById('cancelModalBtn').onclick = closeModal;

  modalForm.onsubmit = async (e) => {
    e.preventDefault();

    const id = document.getElementById('evId').value;
    const payload = {
      title: document.getElementById('evTitle').value,
      date: document.getElementById('evDate').value,
      time: document.getElementById('evTime').value,
      endDate: document.getElementById('evEndDate').value,
      endTime: document.getElementById('evEndTime').value,
      member: document.getElementById('evMember').value,
      location: document.getElementById('evLocation').value,
      notes: document.getElementById('evNotes').value
    };

    try {
      if (id) {
        await API.updateEvent(id, payload);
      } else {
        await API.createEvent(payload);
      }
      closeModal();
      await renderSchedules(document.getElementById('tabContent'));
    } catch (err) {
      console.error("Failed to save event:", err);
      alert("Error saving event.");
    }
  };
}
