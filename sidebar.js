const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('backdrop');
const search = document.getElementById('search');
const empty = document.getElementById('empty');
const root = document.documentElement;

// Guruhlarni ochish/yopish
document.querySelectorAll('.group-toggle').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('.group').classList.toggle('collapsed'));
});

// Aktiv elementni tanlash
document.querySelectorAll('.group li a').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.group li a.active').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
    a.classList.remove('unread');
    document.querySelector('.content h1').textContent = a.textContent;
    closeMobile();
  });
});

// Qidiruv
search.addEventListener('input', () => {
  const q = search.value.trim().toLowerCase();
  let found = 0;
  document.querySelectorAll('.group').forEach(group => {
    let groupHits = 0;
    group.querySelectorAll('li').forEach(li => {
      const hit = li.textContent.toLowerCase().includes(q);
      li.hidden = !hit;
      if (hit) groupHits++;
    });
    group.hidden = q && !groupHits;
    if (q && groupHits) group.classList.remove('collapsed');
    found += groupHits;
  });
  empty.hidden = found > 0;
});

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    sidebar.classList.remove('mini');
    search.focus();
  }
  if (e.key === 'Escape') closeMobile();
});

// Desktopda yig'ish
document.getElementById('collapseBtn').addEventListener('click', () => {
  sidebar.classList.toggle('mini');
  try { localStorage.setItem('sb-mini', sidebar.classList.contains('mini')); } catch {}
});
try { if (localStorage.getItem('sb-mini') === 'true') sidebar.classList.add('mini'); } catch {}

// Mobil menyu
document.getElementById('openBtn').addEventListener('click', () => {
  sidebar.classList.add('open');
  backdrop.classList.add('show');
});
backdrop.addEventListener('click', closeMobile);
function closeMobile() {
  sidebar.classList.remove('open');
  backdrop.classList.remove('show');
}

// Yorug'/qorong'i mavzu
const setTheme = t => {
  root.dataset.theme = t;
  try { localStorage.setItem('theme', t); } catch {}
};
let saved = null;
try { saved = localStorage.getItem('theme'); } catch {}
setTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
document.getElementById('themeBtn').addEventListener('click', () => {
  setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
});
