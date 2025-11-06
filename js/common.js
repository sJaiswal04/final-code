

const qs = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);


const defaultData = [
  { id: 1, title: 'Large pothole on Main Street', category: 'Pothole', location: 'Main Street, Mumbai', desc: 'A deep pothole causing traffic delays.', photo: '', lat: 19.0760, lon: 72.8777, votes: 12, status: 'open', reporter: 'rajesh', comments: [], assignedAt: null },
  { id: 2, title: 'Overflowing trash bin', category: 'Garbage', location: 'Park Avenue, Delhi', desc: 'Trash not collected for over a week.', photo: '', lat: 28.7041, lon: 77.1025, votes: 8, status: 'inprogress', reporter: 'priya', comments: [{ user: 'admin', text: 'Team dispatched.', timestamp: '2025-10-26T14:30:00Z' }], assignedAt: '2025-10-26T14:00:00Z' },
  { id: 3, title: 'Flickering streetlight', category: 'Streetlight', location: 'Colaba, Mumbai', desc: 'Streetlight keeps turning on and off at night.', photo: '', lat: 18.9220, lon: 72.8300, votes: 5, status: 'closed', reporter: 'amit', comments: [{ user: 'admin', text: 'Repaired on 10/25/2025.', timestamp: '2025-10-25T09:15:00Z' }], assignedAt: '2025-10-24T10:00:00Z' },
  { id: 4, title: 'Waterlogging after rain', category: 'Waterlogging', location: 'Andheri East, Mumbai', desc: 'Heavy waterlogging blocking the road.', photo: '', lat: 19.1139, lon: 72.8577, votes: 20, status: 'open', reporter: 'sunita', comments: [], assignedAt: null },
  { id: 5, title: 'Broken bench in park', category: 'Garbage', location: 'Lodhi Garden, Delhi', desc: 'Bench is damaged and unsafe to use.', photo: '', lat: 28.5880, lon: 77.2197, votes: 3, status: 'inprogress', reporter: 'vikram', comments: [], assignedAt: '2025-10-27T09:00:00Z' }
];



function loadData() {
  try {
    const raw = localStorage.getItem('uc_issues');
   
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to load issues:', e);
    return [];
  }
}

function saveData(data) {
  try {
    localStorage.setItem('uc_issues', JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save issues:', e);
  }
}


let issues = loadData();
let upvotes = JSON.parse(localStorage.getItem('uc_upvotes') || '{}');
let role = localStorage.getItem('uc_role') || 'user';
let currentUser = localStorage.getItem('uc_user') || 'Guest';
localStorage.setItem('uc_user', currentUser);
let profilePic =
  localStorage.getItem('uc_profile_pic') ||
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><circle cx="24" cy="24" r="24" fill="%23e6eef6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23004d40">User</text></svg>';
let geoCache = JSON.parse(localStorage.getItem('uc_geo_cache') || '{}');
let lastDeletedIssue = null;



function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.innerHTML = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function getCategoryIcon(category) {
  const icons = {
    Pothole: '🚧',
    Garbage: '🗑️',
    Streetlight: '💡',
    Waterlogging: '💧'
  };
  return icons[category] || '📍';
}

function observeIssues(container) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = 1;
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  container.querySelectorAll('.issue').forEach(issue => {
    issue.style.opacity = 0;
    issue.style.transform = 'translateY(20px)';
    issue.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    observer.observe(issue);
  });
}

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}



async function reverseGeocode(lat, lon) {
  const cacheKey = `${lat},${lon}`;
  if (geoCache[cacheKey]) return geoCache[cacheKey];
  qs('#r-location').classList.add('loading');
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'UrbanCivic/1.0 (Demo Project)' } }
    );
    const data = await response.json();
    if (data?.display_name) {
      geoCache[cacheKey] = data.display_name;
      localStorage.setItem('uc_geo_cache', JSON.stringify(geoCache));
      return data.display_name;
    }
    throw new Error('No address found');
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    return 'Unknown location';
  } finally {
    qs('#r-location').classList.remove('loading');
  }
}


window.addEventListener('storage', event => {
  if (event.key === 'uc_issues') {
    try {
      issues = JSON.parse(event.newValue || '[]');
      document.dispatchEvent(new CustomEvent('issuesUpdated'));
    } catch (e) {
      console.warn('Failed to refresh issues on change', e);
    }
  }
});
