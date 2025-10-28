const socket = io('https://funest-efrain-uncommonly.ngrok-free.dev');

const handleInput = document.getElementById('handle');
const messageInput = document.getElementById('message');
const sendBtn = document.getElementById('send');
const chatWindow = document.getElementById('chat-window');

function getPokemonID(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % 898;
  }
  return hash === 0 ? 1 : hash;
}

function appendMessage(data) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('d-flex', 'align-items-start', 'mb-2');

  const pokeID = getPokemonID(data.handle);
  const pokeImg = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeID}.png`;

  messageDiv.innerHTML = `
    <img src="${pokeImg}" alt="${data.handle}" width="40" height="40" class="me-2">
    <div class="message-content p-2 rounded bg-light border" style="max-width: 80%;">
      <div class="fw-bold text-primary">${data.handle}</div>
      <div>${data.message}</div>
    </div>
  `;

  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function appendSystemMessage(text) {
  const sysDiv = document.createElement('div');
  sysDiv.classList.add('text-center', 'text-secondary', 'fst-italic', 'my-1');
  sysDiv.textContent = text;
  chatWindow.appendChild(sysDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

sendBtn.addEventListener('click', () => {
  const handle = handleInput.value.trim();
  const message = messageInput.value.trim();

  if (!handle || !message) return;

  console.log("Sending message:", handle, message);
  socket.emit('chatMessage', { handle, message });
  messageInput.value = '';
});

socket.on('chatMessage', data => {
  appendMessage(data);
});

socket.on('systemMessage', text => {
  appendSystemMessage(text);
});