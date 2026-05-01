/* ===== HAMBURGER MENU ===== */
document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    });
  }

  /* ===== FAQ ACCORDION ===== */
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.parentElement;
      var isActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('active'); });
      if (!isActive) item.classList.add('active');
    });
  });

  /* ===== CHAT WIDGET ===== */
  var chatBtn = document.querySelector('.chat-btn');
  var chatPanel = document.querySelector('.chat-panel');
  var chatClose = document.querySelector('.chat-close');
  var chatInput = document.querySelector('.chat-input');
  var chatSend = document.querySelector('.chat-send');
  var chatBody = document.querySelector('.chat-body');

  if (chatBtn && chatPanel) {
    chatBtn.addEventListener('click', function () {
      chatPanel.classList.toggle('active');
      chatBtn.style.display = chatPanel.classList.contains('active') ? 'none' : 'flex';
    });
    chatClose.addEventListener('click', function () {
      chatPanel.classList.remove('active');
      chatBtn.style.display = 'flex';
    });
  }

  function addMsg(text, type) {
    var div = document.createElement('div');
    div.className = 'chat-msg ' + type;
    div.textContent = text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function botReply(msg) {
    var lower = msg.toLowerCase();
    if (lower.includes('price') || lower.includes('cost') || lower.includes('estimate') || lower.includes('quote')) {
      return 'We offer free estimates! Most roof repairs range from $300-$1,500 and full replacements from $8,000-$25,000 depending on size and materials. Want us to schedule a free inspection?';
    } else if (lower.includes('emergency') || lower.includes('leak') || lower.includes('storm') || lower.includes('urgent')) {
      return 'We handle emergency roof repairs! Our team can usually respond within 2-4 hours for urgent leaks and storm damage. Call us at (555) 987-6543 for immediate help.';
    } else if (lower.includes('service') || lower.includes('offer') || lower.includes('do')) {
      return 'We offer roof replacement, roof repair, storm damage restoration, gutter installation, inspections, and commercial roofing. Which service interests you?';
    } else if (lower.includes('hour') || lower.includes('open') || lower.includes('time') || lower.includes('schedule')) {
      return 'We\'re open Monday-Friday 7AM-6PM and Saturday 8AM-4PM. We also offer emergency services 24/7. Want to schedule an appointment?';
    } else if (lower.includes('material') || lower.includes('shingle') || lower.includes('metal') || lower.includes('tile')) {
      return 'We work with asphalt shingles, metal roofing, tile, slate, and flat roofing systems. Our team can help you choose the best option for your budget and home style.';
    } else if (lower.includes('warranty') || lower.includes('guarantee')) {
      return 'All our work comes with a satisfaction guarantee. We offer 10-year workmanship warranties and pass through full manufacturer material warranties up to 50 years.';
    } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return 'Hello! Welcome to Summit Roofing. How can I help you today? I can answer questions about our services, pricing, or help you schedule an estimate.';
    } else {
      return 'Thanks for your message! For the best assistance, call us at (555) 987-6543 or fill out our contact form. We typically respond within 1 hour during business hours.';
    }
  }

  function sendMessage() {
    if (!chatInput) return;
    var val = chatInput.value.trim();
    if (!val) return;
    addMsg(val, 'user');
    chatInput.value = '';
    setTimeout(function () {
      addMsg(botReply(val), 'bot');
    }, 500);
  }

  if (chatSend) chatSend.addEventListener('click', sendMessage);
  if (chatInput) chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendMessage();
  });

  document.querySelectorAll('.chat-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var text = chip.textContent;
      addMsg(text, 'user');
      setTimeout(function () {
        addMsg(botReply(text), 'bot');
      }, 500);
    });
  });
});
