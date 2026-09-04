import { API } from '../api.js';

export async function renderMessages(container) {
  container.innerHTML = `
    <div class="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col h-[650px] overflow-hidden">
      <!-- Chat Header -->
      <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h2 class="font-bold text-slate-900 text-base">Family Chat</h2>
          <p class="text-xs text-slate-500">Share updates, reminders, and quick notes</p>
        </div>
        <button id="refreshMessagesBtn" class="text-slate-400 hover:text-indigo-600 text-xs font-semibold flex items-center gap-1 transition-colors">
          <i class="fa-solid fa-rotate-right"></i> Refresh
        </button>
      </div>

      <!-- Messages Feed -->
      <div id="messagesFeed" class="flex-grow p-6 overflow-y-auto space-y-4">
        <div class="text-center py-10 text-slate-400 text-xs">Loading messages...</div>
      </div>

      <!-- Input Form -->
      <form id="sendMessageForm" class="p-4 border-t border-slate-100 bg-white flex gap-2">
        <input type="text" id="messageInput" required placeholder="Type a message to the family..." class="flex-grow text-xs px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-indigo-600">
        <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-2xl text-xs transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2">
          <span>Send</span>
          <i class="fa-solid fa-paper-plane text-[10px]"></i>
        </button>
      </form>
    </div>
  `;

  document.getElementById('sendMessageForm').onsubmit = async (e) => {
    e.preventDefault();
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text) return;

    // Get current user's display name or nickname from Firebase Auth
    let senderName = 'Family Member';
    if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
      const user = firebase.auth().currentUser;
      senderName = user.displayName || user.email.split('@')[0];
    }

    input.value = '';
    try {
      await API.sendMessage(text, senderName);
      await loadMessages();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  document.getElementById('refreshMessagesBtn').onclick = loadMessages;

  await loadMessages();
}

async function loadMessages() {
  const feed = document.getElementById('messagesFeed');
  try {
    const messages = await API.getMessages();
  console.log('Reached here in loadMessages()');
    const messageList = Array.isArray(messages) ? messages : [];

    if (!messageList.length) {
      feed.innerHTML = `<div class="text-center py-12 text-slate-400 text-xs">No messages yet. Start the conversation!</div>`;
      return;
    }


    feed.innerHTML = messageList.map(msg => `
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200">
          ${(msg.sender || 'F').charAt(0).toUpperCase()}
        </div>
        <div class="space-y-1 max-w-[80%]">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-900">${msg.sender || 'Family Member'}</span>
            <span class="text-[10px] text-slate-400">${msg.timestamp || 'Just now'}</span>
          </div>
          <div class="bg-slate-100 text-slate-800 text-xs p-3 rounded-2xl rounded-tl-xs leading-relaxed">
            ${msg.text}
          </div>
        </div>
      </div>
    `).join('');
    

    // Auto-scroll to bottom of feed
    feed.scrollTop = feed.scrollHeight;
  } catch (err) {
    console.error("Error loading messages:", err);
    feed.innerHTML = `<div class="text-center text-rose-500 text-xs py-6">Error loading messages.</div>`;
  }
}
