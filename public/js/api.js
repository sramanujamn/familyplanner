// public/js/api.js
async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };

  if (typeof firebase !== 'undefined' && firebase.auth) {
    const user = firebase.auth().currentUser;
    if (user) {
      try {
        // Force refresh token to prevent stale 403s
        const token = await user.getIdToken(/* forceRefresh */ true);
        headers['Authorization'] = `Bearer ${token}`;
      } catch (err) {
        console.error("Error fetching Auth ID Token:", err);
      }
    }
  }

  return headers;
}

export const API = {
  // Schedules
  getEvents: async () => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/events', { headers });
    return res.json();
  },
  createEvent: async (data) => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/events', { method: 'POST', headers, body: JSON.stringify(data) });
    return res.json();
  },
  deleteEvent: async (id) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE', headers });
    return res.json();
  },

  // Homework
  getHomework: async () => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/homework', { headers });
    return res.json();
  },
  createHomework: async (data) => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/homework', { method: 'POST', headers, body: JSON.stringify(data) });
    return res.json();
  },
  updateHomeworkStatus: async (id, status) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/homework/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ status }) });
    return res.json();
  },
  deleteHomework: async (id) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/homework/${id}`, { method: 'DELETE', headers });
    return res.json();
  },

  // Trips
  getTrips: async () => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/trips', { headers });
    return res.json();
  },
  createTrip: async (data) => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/trips', { method: 'POST', headers, body: JSON.stringify(data) });
    return res.json();
  },
  updateTripChecklist: async (id, items) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/trips/${id}/checklist`, { method: 'PATCH', headers, body: JSON.stringify({ items }) });
    return res.json();
  },
  deleteTrip: async (id) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/trips/${id}`, { method: 'DELETE', headers });
    return res.json();
  },

  // Corkboard / Fridge Door
  getCorkboard: async () => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/corkboard', { headers });
    return res.json();
  },
  createCorkboardItem: async (data) => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/corkboard', { method: 'POST', headers, body: JSON.stringify(data) });
    return res.json();
  },
  updateCorkboardList: async (id, items) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/corkboard/${id}/list`, { method: 'PATCH', headers, body: JSON.stringify({ items }) });
    return res.json();
  },
  deleteCorkboardItem: async (id) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/corkboard/${id}`, { method: 'DELETE', headers });
    return res.json();
  },

  // Family Workspace & Dynamic Members
  getFamily: async () => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/family', { headers });
    return res.json();
  },
  createFamily: async (familyName, initialMembers) => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/family/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ familyName, initialMembers })
    });
    return res.json();
  },
  addFamilyMember: async (familyId, newMember) => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/family/members', {
      method: 'POST',
      headers,
      body: JSON.stringify({ familyId, newMember })
    });
    return res.json();
  }
  
};
