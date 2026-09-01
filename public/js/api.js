// public/js/api.js

/**
 * Helper function to retrieve the current Firebase Auth ID Token.
 * Forces a token refresh to prevent stale authentication or 403 Forbidden errors.
 */
async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };

  if (typeof firebase !== 'undefined' && firebase.auth) {
    const user = firebase.auth().currentUser;
    if (user) {
      try {
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
  // ==========================================
  // FAMILY WORKSPACE & PROFILE MANAGEMENT
  // ==========================================

  /**
   * Fetches the current user's workspace profile and family details.
   */
  getFamily: async () => 
    fetch('/api/family', { headers: await getAuthHeaders() }).then(r => r.json()),

  /**
   * Creates a new family workspace.
   */
  createFamily: async (familyName, initialMembers) => 
    fetch('/api/family/create', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ familyName, initialMembers })
    }).then(r => r.json()),

  /**
   * Joins an existing family workspace using a Join Code.
   */
  joinFamily: async (joinCode, memberName) => 
    fetch('/api/family/join', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ joinCode, memberName })
    }).then(r => r.json()),

  /**
   * Adds a new member name to the family roster.
   */
  addFamilyMember: async (newMember) => 
    fetch('/api/family/members', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ newMember })
    }).then(r => r.json()),

  /**
   * Fetches all registered user profiles in the active family workspace.
   */
  getFamilyUsers: async () => 
    fetch('/api/family/users', { headers: await getAuthHeaders() }).then(r => r.json()),

  /**
   * Sends a heartbeat ping to mark the active user as online.
   */
  updatePresence: async () => 
    fetch('/api/family/presence', { 
      method: 'POST', 
      headers: await getAuthHeaders() 
    }).then(r => r.json()),

  /**
   * Gets the logged-in user's profile metadata.
   */
  getProfile: async () => 
    fetch('/api/family/profile', { headers: await getAuthHeaders() }).then(r => r.json()),

  /**
   * Updates the logged-in user's profile details.
   */
  updateProfile: async (data) => 
    fetch('/api/family/profile', {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(r => r.json()),

  // ==========================================
  // SCHEDULE EVENTS
  // ==========================================

  getEvents: async () => 
    fetch('/api/events', { headers: await getAuthHeaders() }).then(r => r.json()),

  createEvent: async (data) => 
    fetch('/api/events', { 
      method: 'POST', 
      headers: await getAuthHeaders(), 
      body: JSON.stringify(data) 
    }).then(r => r.json()),

  deleteEvent: async (id) => 
    fetch(`/api/events/${id}`, { 
      method: 'DELETE', 
      headers: await getAuthHeaders() 
    }).then(r => r.json()),

  // ==========================================
  // HOMEWORK & ASSIGNMENTS
  // ==========================================

  getHomework: async () => 
    fetch('/api/homework', { headers: await getAuthHeaders() }).then(r => r.json()),

  createHomework: async (data) => 
    fetch('/api/homework', { 
      method: 'POST', 
      headers: await getAuthHeaders(), 
      body: JSON.stringify(data) 
    }).then(r => r.json()),

  updateHomeworkStatus: async (id, status) => 
    fetch(`/api/homework/${id}`, { 
      method: 'PATCH', 
      headers: await getAuthHeaders(), 
      body: JSON.stringify({ status }) 
    }).then(r => r.json()),

  deleteHomework: async (id) => 
    fetch(`/api/homework/${id}`, { 
      method: 'DELETE', 
      headers: await getAuthHeaders() 
    }).then(r => r.json()),

  // ==========================================
  // TRIPS & VACATION PLANNING
  // ==========================================

  getTrips: async () => 
    fetch('/api/trips', { headers: await getAuthHeaders() }).then(r => r.json()),

  createTrip: async (data) => 
    fetch('/api/trips', { 
      method: 'POST', 
      headers: await getAuthHeaders(), 
      body: JSON.stringify(data) 
    }).then(r => r.json()),

  deleteTrip: async (id) => 
    fetch(`/api/trips/${id}`, { 
      method: 'DELETE', 
      headers: await getAuthHeaders() 
    }).then(r => r.json()),

  // ==========================================
  // CORKBOARD / FRIDGE DOOR
  // ==========================================

  getCorkboard: async () => 
    fetch('/api/corkboard', { headers: await getAuthHeaders() }).then(r => r.json()),

  createCorkboardItem: async (data) => 
    fetch('/api/corkboard', { 
      method: 'POST', 
      headers: await getAuthHeaders(), 
      body: JSON.stringify(data) 
    }).then(r => r.json()),

  updateCorkboardList: async (id, items) => 
    fetch(`/api/corkboard/${id}/list`, { 
      method: 'PATCH', 
      headers: await getAuthHeaders(), 
      body: JSON.stringify({ items }) 
    }).then(r => r.json()),

  deleteCorkboardItem: async (id) => 
    fetch(`/api/corkboard/${id}`, { 
      method: 'DELETE', 
      headers: await getAuthHeaders() 
    }).then(r => r.json())
};
