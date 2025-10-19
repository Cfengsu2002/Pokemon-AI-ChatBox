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
  messageDiv.classList.add('message');

  const pokeID = getPokemonID(data.handle);
  const pokeImg = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeID}.png`;

  messageDiv.innerHTML = `
    <img src="${pokeImg}" alt="${data.handle}">
    <div class="message-content">
      <div class="username">${data.handle}</div>
      <div class="text">${data.message}</div>
    </div>
  `;

  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function appendSystemMessage(text) {
  const sysDiv = document.createElement('div');
  sysDiv.classList.add('system-message');
  sysDiv.textContent = text;
  chatWindow.appendChild(sysDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

sendBtn.addEventListener('click', () => {
  const handle = handleInput.value.trim();
  const message = messageInput.value.trim();

  if (!handle || !message) return;
  socket.emit('chatMessage', { handle, message });
  messageInput.value = '';
});

// 接收消息
socket.on('chatMessage', data => {
  appendMessage(data);
});

socket.on('systemMessage', text => {
  appendSystemMessage(text);
});
