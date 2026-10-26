const form = document.querySelector('#chat-form');
const input = document.querySelector('#chat-input');
const messagesElement = document.querySelector('#chat-messages');
const sendButton = document.querySelector('.send-button');
const suggestions = document.querySelector('#suggestions');

const conversation = [];

function addMessage(role, text) {
  const row = document.createElement('div');
  row.className = `message-row ${role === 'user' ? 'user-row' : 'assistant-row'}`;

  if (role !== 'user') {
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = '✳';
    row.append(avatar);
  }

  const bubble = document.createElement('div');
  bubble.className = `message-bubble ${role === 'user' ? 'user-bubble' : 'assistant-bubble'}`;
  const paragraph = document.createElement('p');
  paragraph.textContent = text;
  const time = document.createElement('span');
  time.className = 'message-time';
  time.textContent = 'Ahora';
  bubble.append(paragraph, time);
  row.append(bubble);
  messagesElement.append(row);
  messagesElement.scrollTop = messagesElement.scrollHeight;
  return row;
}

function addTypingIndicator() {
  const row = document.createElement('div');
  row.className = 'message-row assistant-row';
  row.setAttribute('aria-label', 'Brújula está preparando una respuesta');
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = '✳';
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble assistant-bubble';
  const dots = document.createElement('span');
  dots.className = 'typing-dots';
  dots.setAttribute('aria-hidden', 'true');
  dots.innerHTML = '<i></i><i></i><i></i>';
  bubble.append(dots);
  row.append(avatar, bubble);
  messagesElement.append(row);
  messagesElement.scrollTop = messagesElement.scrollHeight;
  return row;
}

function setBusy(busy) {
  sendButton.disabled = busy;
  input.disabled = busy;
  form.setAttribute('aria-busy', String(busy));
}

async function sendMessage(text) {
  const message = text.trim();
  if (!message || sendButton.disabled) return;

  addMessage('user', message);
  conversation.push({ role: 'user', text: message });
  input.value = '';
  suggestions.hidden = true;
  setBusy(true);
  const typing = addTypingIndicator();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversation.slice(-12) }),
    });
    const data = await response.json().catch(() => ({}));
    typing.remove();

    if (!response.ok) {
      throw new Error(data.error || 'No pude responder en este momento. Probá de nuevo en unos segundos.');
    }

    const reply = typeof data.reply === 'string' ? data.reply.trim() : '';
    if (!reply) throw new Error('No llegó una respuesta. Probá reformular la pregunta.');
    conversation.push({ role: 'assistant', text: reply });
    addMessage('assistant', reply);
  } catch (error) {
    typing.remove();
    conversation.pop();
    addMessage('assistant', error.message || 'Se interrumpió la conexión. Probá de nuevo.');
  } finally {
    setBusy(false);
    input.focus();
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  sendMessage(input.value);
});

suggestions.addEventListener('click', (event) => {
  const chip = event.target.closest('.suggestion-chip');
  if (!chip) return;
  sendMessage(chip.textContent);
});

input.addEventListener('input', () => {
  if (input.value.length > 0) suggestions.hidden = true;
});

input.addEventListener('focus', () => {
  if (conversation.length === 0 && !input.value) suggestions.hidden = false;
});
