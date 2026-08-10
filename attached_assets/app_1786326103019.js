
const STORAGE_KEY = 'familyFriendsCommunityAdminDataV1';

const demoData = {
  homepage: {
    heroEyebrow: 'COMMUNITY HUB',
    heroHeadline: 'Stay connected to the moments that matter.',
    heroDescription: 'One place for family events, major announcements, important plans, celebrations, group decisions, and community updates.',
    heroPrimaryButton: 'Upcoming Events',
    heroSecondaryButton: 'Latest Announcements',
    nextEventLabel: 'Next big event',
    communityName: 'Family & Friends'
  },
  announcements: [
    {
      id: crypto.randomUUID(),
      title: 'Family Weekend details are officially confirmed',
      category: 'Major Update',
      date: '2026-08-09',
      summary: 'The date, location, food plan, and main activities are locked in. RSVP before September 5 so final arrangements can be made.',
      featured: true
    },
    {
      id: crypto.randomUUID(),
      title: 'New shared photo archive is live',
      category: 'Community',
      date: '2026-08-06',
      summary: 'We now have one central place for family photos, videos, old memories, and event albums.',
      featured: false
    }
  ],
  events: [
    {
      id: crypto.randomUUID(),
      title: 'Annual Family Weekend',
      date: '2026-09-19',
      time: '14:00',
      endTime: '20:00',
      location: 'Riverside Park Pavilion',
      description: 'Food, games, photos, family updates, and a full afternoon together.',
      featured: true
    },
    {
      id: crypto.randomUUID(),
      title: 'Family Dinner Night',
      date: '2026-10-10',
      time: '18:30',
      endTime: '',
      location: 'Downtown',
      description: 'Monthly dinner night for everyone who can make it.',
      featured: false
    }
  ],
  actions: [
    {
      id: crypto.randomUUID(),
      title: 'Help with the family move',
      status: 'In Progress',
      icon: '🏡',
      description: 'Coordinating vehicles, boxes, pickup times, and volunteers for moving day.',
      progress: 68,
      participants: 17
    },
    {
      id: crypto.randomUUID(),
      title: 'Group birthday surprise',
      status: 'Organizing',
      icon: '🎁',
      description: 'Collecting contributions, planning the surprise, and coordinating arrival times.',
      progress: 42,
      participants: 11
    }
  ],
  stats: {
    membersConnected: 26,
    announcementStatLabel: 'Active Announcements',
    eventStatLabel: 'Upcoming Events',
    actionStatLabel: 'Community Actions',
    memberStatLabel: 'Members Connected'
  },
  settings: {
    contactEmail: 'family@example.com',
    rsvpDeadlineText: 'RSVP before September 5',
    footerMessage: 'Events, announcements, and important moments in one place.',
    signupEnabled: true,
    siteVisibility: 'private'
  }
};

let data = loadData();
let currentEdit = null;

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(demoData);
  try { return JSON.parse(saved); } catch { return structuredClone(demoData); }
}

function persist(show=true) {
  syncBasicFormsToData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  if (show) toast('Changes saved.');
  renderAll();
}

function syncBasicFormsToData() {
  const homeFields = ['heroEyebrow','heroHeadline','heroDescription','heroPrimaryButton','heroSecondaryButton','nextEventLabel','communityName'];
  homeFields.forEach(key => {
    const el = document.getElementById(key);
    if (el) data.homepage[key] = el.value;
  });

  data.stats.membersConnected = Number(document.getElementById('membersConnected')?.value ?? data.stats.membersConnected);
  ['announcementStatLabel','eventStatLabel','actionStatLabel','memberStatLabel'].forEach(key => {
    const el = document.getElementById(key); if (el) data.stats[key] = el.value;
  });

  ['contactEmail','rsvpDeadlineText','footerMessage'].forEach(key => {
    const el = document.getElementById(key); if (el) data.settings[key] = el.value;
  });
  const signup = document.getElementById('signupEnabled');
  const visibility = document.getElementById('siteVisibility');
  if (signup) data.settings.signupEnabled = signup.value === 'true';
  if (visibility) data.settings.siteVisibility = visibility.value;
}

function populateForms() {
  Object.entries(data.homepage).forEach(([key,val]) => {
    const el = document.getElementById(key); if (el) el.value = val;
  });
  Object.entries(data.stats).forEach(([key,val]) => {
    const el = document.getElementById(key); if (el) el.value = val;
  });
  Object.entries(data.settings).forEach(([key,val]) => {
    const el = document.getElementById(key);
    if (!el) return;
    el.value = typeof val === 'boolean' ? String(val) : val;
  });
}

function renderAll() {
  populateForms();
  renderMetrics();
  renderAnnouncements();
  renderEvents();
  renderActions();
}

function renderMetrics() {
  document.getElementById('announcementCount').textContent = data.announcements.length;
  document.getElementById('eventCount').textContent = data.events.length;
  document.getElementById('actionCount').textContent = data.actions.length;
  document.getElementById('memberCountMetric').textContent = data.stats.membersConnected;

  const upcoming = [...data.events].sort((a,b)=>new Date(a.date+'T'+(a.time||'00:00')) - new Date(b.date+'T'+(b.time||'00:00')))[0];
  document.getElementById('nextEventName').textContent = upcoming?.title || '—';
  document.getElementById('nextEventDetails').textContent = upcoming ? `${formatDate(upcoming.date)} • ${formatTime(upcoming.time)} • ${upcoming.location}` : 'No upcoming event.';

  const latest = [...data.announcements].sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  document.getElementById('latestAnnouncementName').textContent = latest?.title || '—';
  document.getElementById('latestAnnouncementDetails').textContent = latest?.summary || 'No announcement.';
}

function renderAnnouncements() {
  const wrap = document.getElementById('announcementList');
  wrap.innerHTML = '';
  data.announcements.forEach(item => {
    wrap.appendChild(createItemCard(
      item.title,
      item.summary,
      [item.category, formatDate(item.date), item.featured ? 'Featured' : 'Standard'],
      () => openEditor('announcement', item.id),
      () => removeItem('announcements', item.id)
    ));
  });
}

function renderEvents() {
  const wrap = document.getElementById('eventList');
  wrap.innerHTML = '';
  data.events.forEach(item => {
    wrap.appendChild(createItemCard(
      item.title,
      item.description,
      [formatDate(item.date), formatTime(item.time), item.location, item.featured ? 'Featured' : 'Standard'],
      () => openEditor('event', item.id),
      () => removeItem('events', item.id)
    ));
  });
}

function renderActions() {
  const wrap = document.getElementById('actionList');
  wrap.innerHTML = '';
  data.actions.forEach(item => {
    wrap.appendChild(createItemCard(
      `${item.icon || ''} ${item.title}`.trim(),
      item.description,
      [item.status, `${item.progress}% complete`, `${item.participants} participants`],
      () => openEditor('action', item.id),
      () => removeItem('actions', item.id)
    ));
  });
}

function createItemCard(title, description, pills, onEdit, onDelete) {
  const card = document.createElement('article');
  card.className = 'item-card';
  const content = document.createElement('div');
  content.innerHTML = `<h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p><div class="item-meta">${pills.map(p=>`<span class="pill">${escapeHtml(String(p))}</span>`).join('')}</div>`;
  const actions = document.createElement('div');
  actions.className = 'item-actions';
  const edit = document.createElement('button'); edit.className='icon-btn'; edit.textContent='Edit'; edit.onclick=onEdit;
  const del = document.createElement('button'); del.className='icon-btn danger'; del.textContent='Delete'; del.onclick=onDelete;
  actions.append(edit, del);
  card.append(content, actions);
  return card;
}

function removeItem(collection, id) {
  if (!confirm('Delete this item?')) return;
  data[collection] = data[collection].filter(x => x.id !== id);
  persist(false);
  toast('Item deleted.');
}

const editorConfigs = {
  announcement: {
    collection: 'announcements',
    label: 'ANNOUNCEMENT',
    title: 'Announcement',
    fields: [
      ['title','Title','text',true],
      ['category','Category','text',false],
      ['date','Date','date',false],
      ['summary','Summary','textarea',true],
      ['featured','Featured','selectBoolean',false]
    ]
  },
  event: {
    collection: 'events',
    label: 'EVENT',
    title: 'Event',
    fields: [
      ['title','Event Name','text',true],
      ['date','Date','date',false],
      ['time','Start Time','time',false],
      ['endTime','End Time','time',false],
      ['location','Location','text',true],
      ['description','Description','textarea',true],
      ['featured','Featured','selectBoolean',false]
    ]
  },
  action: {
    collection: 'actions',
    label: 'BIG ACTION',
    title: 'Community Action',
    fields: [
      ['title','Title','text',true],
      ['status','Status','text',false],
      ['icon','Icon / Emoji','text',false],
      ['description','Description','textarea',true],
      ['progress','Progress %','number',false],
      ['participants','Participants','number',false]
    ]
  }
};

function openEditor(type, id=null) {
  const cfg = editorConfigs[type];
  currentEdit = { type, id };
  document.getElementById('modalType').textContent = cfg.label;
  document.getElementById('modalTitle').textContent = id ? `Edit ${cfg.title}` : `Add ${cfg.title}`;
  const existing = id ? data[cfg.collection].find(x=>x.id===id) : {};
  const wrap = document.getElementById('modalFields');
  wrap.innerHTML = '';

  cfg.fields.forEach(([key,label,typeField,full]) => {
    const lab = document.createElement('label');
    if (full) lab.className = 'full-field';
    lab.append(document.createTextNode(label));
    let input;
    if (typeField === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 4;
    } else if (typeField === 'selectBoolean') {
      input = document.createElement('select');
      input.innerHTML = '<option value="true">Yes</option><option value="false">No</option>';
    } else {
      input = document.createElement('input');
      input.type = typeField;
      if (typeField === 'number') input.min = 0;
    }
    input.name = key;
    const val = existing?.[key];
    input.value = typeof val === 'boolean' ? String(val) : (val ?? defaultField(type,key));
    lab.append(input);
    wrap.append(lab);
  });
  document.getElementById('modalBackdrop').classList.add('open');
}

function defaultField(type,key){
  if(key==='date') return new Date().toISOString().slice(0,10);
  if(key==='progress'||key==='participants') return 0;
  if(key==='featured') return 'false';
  if(type==='action'&&key==='status') return 'Planning';
  return '';
}

function closeEditor() {
  document.getElementById('modalBackdrop').classList.remove('open');
  currentEdit = null;
}

document.getElementById('editorForm').addEventListener('submit', e => {
  e.preventDefault();
  const cfg = editorConfigs[currentEdit.type];
  const form = new FormData(e.currentTarget);
  const obj = { id: currentEdit.id || crypto.randomUUID() };
  cfg.fields.forEach(([key,,typeField]) => {
    let val = form.get(key);
    if (typeField === 'selectBoolean') val = val === 'true';
    if (typeField === 'number') val = Number(val);
    obj[key] = val;
  });

  if (currentEdit.id) {
    const idx = data[cfg.collection].findIndex(x=>x.id===currentEdit.id);
    data[cfg.collection][idx] = obj;
  } else {
    data[cfg.collection].push(obj);
  }
  persist(false);
  closeEditor();
  toast('Item saved.');
});

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.panel-section').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.section).classList.add('active');
    document.getElementById('pageTitle').textContent = btn.textContent;
  });
});

document.getElementById('addAnnouncementBtn').onclick = () => openEditor('announcement');
document.getElementById('addEventBtn').onclick = () => openEditor('event');
document.getElementById('addActionBtn').onclick = () => openEditor('action');
document.getElementById('modalClose').onclick = closeEditor;
document.getElementById('cancelModal').onclick = closeEditor;
document.getElementById('modalBackdrop').addEventListener('click', e => { if (e.target.id === 'modalBackdrop') closeEditor(); });
document.getElementById('saveAllBtn').onclick = () => persist(true);

document.getElementById('resetBtn').onclick = () => {
  if (!confirm('Reset all admin content back to the demo?')) return;
  data = structuredClone(demoData);
  persist(false);
  toast('Demo content restored.');
};

document.getElementById('exportBtn').onclick = () => {
  syncBasicFormsToData();
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'family-friends-community-data.json'; a.click();
  URL.revokeObjectURL(url);
};

document.getElementById('importInput').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    data = imported;
    persist(false);
    toast('Data imported.');
  } catch {
    alert('That file is not valid community JSON.');
  }
  e.target.value = '';
});

function formatDate(value) {
  if (!value) return 'No date';
  const d = new Date(value+'T00:00:00');
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function formatTime(value) {
  if (!value) return 'No time';
  return new Date('1970-01-01T'+value).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),2200);
}

renderAll();
