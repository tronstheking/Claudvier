// HELPER FUNCTIONS & UTILITIES

function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

function formatPhoneNumber(phoneStr) {
  let cleaned = phoneStr.trim();
  if (!cleaned) return '';

  // Remove spaces, hyphens, and parentheses
  cleaned = cleaned.replace(/[\s\-\(\)]/g, '');

  // Auto-prefix for Venezuelan numbers if code is missing
  if (!cleaned.startsWith('+')) {
    // If starts with '04' (e.g. 04121234567) and has 11 digits
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = '+58' + cleaned.substring(1);
    }
    // If starts with '4' or '2' and has 10 digits (e.g. 4121234567)
    else if ((cleaned.startsWith('4') || cleaned.startsWith('2')) && cleaned.length === 10) {
      cleaned = '+58' + cleaned;
    }
    // If starts with '58' and has 12 digits (e.g. 584121234567)
    else if (cleaned.startsWith('58') && cleaned.length === 12) {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
}

function formatDateShort(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: '2-digit' });
}

function formatDateFull(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('es-VE', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 0) return 'Hace un momento';
  if (seconds < 60) return `Hace ${seconds} seg`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} horas`;
  
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 30) return `Hace ${days} días`;
  
  return date.toLocaleDateString('es-VE', { month: 'short', day: 'numeric' });
}

function calculateInitials(nombre, apellido) {
  let initials = '';
  if (nombre) initials += nombre[0].toUpperCase();
  if (apellido) initials += apellido[0].toUpperCase();
  return initials || 'U';
}

function getCourseName(courseId) {
  const course = cursos.find(c => c.id === courseId);
  return course ? course.nombre : 'Curso Desconocido';
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'check-circle';
  if (type === 'error') icon = 'x-circle';
  if (type === 'info') icon = 'info';

  toast.innerHTML = `
    <i data-lucide="${icon}" class="toast-icon ${type}"></i>
    <div class="toast-content">
      <div class="toast-message">${escapeHTML(message)}</div>
    </div>
    <div class="toast-progress"></div>
  `;

  container.appendChild(toast);
  if (window.lucide) {
    lucide.createIcons();
  }

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      if (toast.parentNode === container) container.removeChild(toast);
    }, 300);
  }, 3000);
}

function triggerConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;

  container.innerHTML = '';
  const colors = ['#4f98a3', '#5591c7', '#e8af34', '#fdab43', '#6daa45', '#d163a7'];
  const limit = 60;

  for (let i = 0; i < limit; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';

    const size = Math.random() * 8 + 6;
    const left = Math.random() * 100;
    const delay = Math.random() * 0.4;
    const duration = Math.random() * 1.5 + 1.2;
    const rotate = Math.random() * 360;
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${left}%`;
    particle.style.backgroundColor = color;
    particle.style.transform = `rotate(${rotate}deg)`;
    particle.style.animationDelay = `${delay}s`;
    particle.style.animationDuration = `${duration}s`;

    const shapeType = Math.floor(Math.random() * 3);
    if (shapeType === 0) {
      particle.style.borderRadius = '50%';
    } else if (shapeType === 1) {
      particle.style.width = '0';
      particle.style.height = '0';
      particle.style.backgroundColor = 'transparent';
      particle.style.borderLeft = `${size / 2}px solid transparent`;
      particle.style.borderRight = `${size / 2}px solid transparent`;
      particle.style.borderBottom = `${size}px solid ${color}`;
    }

    container.appendChild(particle);
  }

  setTimeout(() => {
    container.innerHTML = '';
  }, 3200);
}

function ensureModalLoaded(id) {
  if (document.getElementById(id)) return;
  const template = document.getElementById(`${id}-template`);
  if (template) {
    // Clone and append template content to document body
    const clone = template.content.cloneNode(true);
    document.body.appendChild(clone);
    if (window.lucide) {
      lucide.createIcons();
    }
  }
}
