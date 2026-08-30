import { API } from '../api.js';

export async function renderTrips(container) {
  container.innerHTML = `
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Trips & Travel Planner</h2>
        <p class="text-xs text-slate-500">Itineraries, lodging, and packing checklists</p>
      </div>
      <button id="addTripBtn" class="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-xl">
        + Plan New Trip
      </button>
    </div>
    <div id="tripsList" class="space-y-4">
      <div class="py-8 text-center text-slate-400">Loading trips...</div>
    </div>
  `;

  document.getElementById('addTripBtn').addEventListener('click', promptAddTrip);
  await loadTrips();
}

async function loadTrips() {
  const list = document.getElementById('tripsList');
  try {
    const trips = await API.getTrips();
    if (!trips.length) {
      list.innerHTML = `<div class="py-8 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">No upcoming trips planned.</div>`;
      return;
    }

    list.innerHTML = trips.map(trip => `
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
        <div class="flex justify-between items-start">
          <div>
            <span class="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100">
              ${trip.start || 'TBD'} - ${trip.end || 'TBD'}
            </span>
            <h3 class="text-xl font-bold text-slate-900 mt-2">${trip.title}</h3>
            ${trip.lodging ? `<p class="text-xs text-slate-500 mt-0.5"><i class="fa-solid fa-hotel mr-1"></i> ${trip.lodging}</p>` : ''}
          </div>
          <button class="delete-trip-btn text-slate-300 hover:text-rose-500 text-xs font-semibold" data-id="${trip.id}">Delete</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.delete-trip-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        await API.deleteTrip(e.currentTarget.dataset.id);
        loadTrips();
      });
    });
  } catch (err) {
    list.innerHTML = `<div class="text-center text-rose-500 text-xs">Error loading trips.</div>`;
  }
}

async function promptAddTrip() {
  const title = prompt("Trip Destination / Name:");
  if (!title) return;
  const start = prompt("Start Date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
  const end = prompt("End Date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);

  await API.createTrip({ title, start, end });
  loadTrips();
}
