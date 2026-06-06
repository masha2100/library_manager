// js/app.js  –  Librarium frontend application
import * as API from './api.js';

let currentPage = 'books';
let searchTimeout;

const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const $  = (id) => document.getElementById(id);
const toast = (msg, type = 'success') => {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;flex-shrink:0">
    ${type==='success' ? '<polyline points="20 6 9 17 4 12"/>' : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
  </svg>${esc(msg)}`;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3200);
};

function openModal(title, bodyHTML, footerHTML) {
  let overlay = $('modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        <span class="modal-title">${esc(title)}</span>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="closeModal()">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
      <div class="modal-footer">${footerHTML}</div>
    </div>`;
  overlay.classList.remove('hidden');
}

window.closeModal = function () {
  const o = $('modal-overlay');
  if (o) o.classList.add('hidden');
};

function showFerr(msg) {
  const el = $('ferr');
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    currentPage = page;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    document.querySelectorAll('[id^="page-"]').forEach(s => s.classList.add('hidden'));
    $(`page-${page}`).classList.remove('hidden');
    $('page-crumb').textContent = page.charAt(0).toUpperCase() + page.slice(1);
    if (page === 'books')   renderBooks();
    if (page === 'authors') renderAuthors();
  });
});

async function updateStats() {
  try {
    const s = await API.books.stats();
    $('stat-total').textContent   = s.total;
    $('stat-avail').textContent   = s.available;
    $('stat-out').textContent     = s.checked_out;
    $('stat-authors').textContent = s.authors;
  } catch { /* ignore */ }
}

async function renderBooks() {
  const params = {
    search:    $('search-input').value.trim(),
    author_id: $('filter-author').value,
    genre:     $('filter-genre').value,
    sort:      $('sort-select').value,
  };

  const tbody  = $('books-tbody');
  const empty  = $('books-empty');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text3)">Loading…</td></tr>';

  try {
    const data = await API.books.list(params);
    await refreshAuthorFilter();
    tbody.innerHTML = '';

    if (data.length === 0) {
      tbody.innerHTML = '';
      empty.classList.remove('hidden');
    } else {
      empty.classList.add('hidden');
      data.forEach((b, i) => {
        const tr = document.createElement('tr');
        tr.style.animationDelay = `${i * 0.03}s`;
        tr.className = 'anim-in';
        tr.innerHTML = `
          <td class="td-title">${esc(b.title)}</td>
          <td>${esc(b.author_name)}</td>
          <td>${b.genre ? `<span class="badge badge-gray">${esc(b.genre)}</span>` : '<span style="color:var(--text3)">—</span>'}</td>
          <td class="td-mono">${b.year || '—'}</td>
          <td class="td-mono">${b.isbn ? esc(b.isbn) : '—'}</td>
          <td>
            <span class="badge ${b.status === 'available' ? 'badge-green' : 'badge-red'}">
              <span class="badge-dot"></span>
              ${b.status === 'available' ? 'Available' : 'Checked out'}
            </span>
          </td>
          <td>
            <div class="td-actions">
              <button class="btn btn-ghost btn-sm btn-icon" title="View" data-action="view" data-id="${b.id}">
                <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon" title="Edit" data-action="edit" data-id="${b.id}">
                <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-danger btn-sm btn-icon" title="Delete" data-action="delete" data-id="${b.id}">
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
              </button>
            </div>
          </td>`;
        tbody.appendChild(tr);
      });
    }
    updateStats();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--red)">${esc(err.message)}</td></tr>`;
  }
}

$('books-tbody').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = +btn.dataset.id;
  const action = btn.dataset.action;
  if (action === 'view')   viewBook(id);
  if (action === 'edit')   editBook(id);
  if (action === 'delete') deleteBook(id);
});

async function refreshAuthorFilter() {
  const sel = $('filter-author');
  const current = sel.value;
  try {
    const data = await API.authors.list();
    sel.innerHTML = '<option value="">All Authors</option>' +
      data.map(a => `<option value="${a.id}" ${a.id == current ? 'selected' : ''}>${esc(a.name)}</option>`).join('');
  } catch { /* ignore */ }
}

async function buildAuthorOptions(selectedId = '') {
  try {
    const data = await API.authors.list();
    return data.map(a => `<option value="${a.id}" ${a.id == selectedId ? 'selected' : ''}>${esc(a.name)}</option>`).join('');
  } catch { return ''; }
}

async function bookFormHTML(b = {}) {
  const options = await buildAuthorOptions(b.author_id || '');
  return `
    <div class="form-grid">
      <div class="field full">
        <label>Title <span style="color:var(--red)">*</span></label>
        <input id="f-title" value="${esc(b.title || '')}" placeholder="Book title"/>
      </div>
      <div class="field full">
        <label>Author <span style="color:var(--red)">*</span></label>
        <select id="f-author"><option value="">Select author…</option>${options}</select>
      </div>
      <div class="field">
        <label>Genre</label>
        <input id="f-genre" value="${esc(b.genre || '')}" placeholder="e.g. Fiction"/>
      </div>
      <div class="field">
        <label>Year</label>
        <input id="f-year" type="number" value="${b.year || ''}" placeholder="e.g. 1984"/>
      </div>
      <div class="field full">
        <label>ISBN</label>
        <input id="f-isbn" value="${esc(b.isbn || '')}" placeholder="978-x-xxx-xxxxx-x"/>
      </div>
      <div class="field full">
        <label>Status</label>
        <select id="f-status">
          <option value="available"   ${b.status !== 'checked_out' ? 'selected' : ''}>Available</option>
          <option value="checked_out" ${b.status === 'checked_out' ? 'selected' : ''}>Checked Out</option>
        </select>
      </div>
      <div class="field full">
        <label>Description</label>
        <textarea id="f-desc" placeholder="Short description…">${esc(b.description || '')}</textarea>
      </div>
    </div>
    <div id="ferr" class="alert-error-inline hidden"></div>`;
}

function getBookData() {
  return {
    title:       $('f-title').value.trim(),
    author_id:   +$('f-author').value,
    genre:       $('f-genre').value.trim() || null,
    year:        $('f-year').value ? +$('f-year').value : null,
    isbn:        $('f-isbn').value.trim() || null,
    status:      $('f-status').value,
    description: $('f-desc').value.trim() || null,
  };
}

async function viewBook(id) {
  try {
    const b = await API.books.get(id);
    openModal(b.title, `
      <div class="detail-section">
        <div class="detail-section-title">Book Details</div>
        <div class="detail-row"><span class="detail-key">Author</span><span class="detail-val">${esc(b.author_name)}</span></div>
        <div class="detail-row"><span class="detail-key">Genre</span><span class="detail-val">${esc(b.genre || '—')}</span></div>
        <div class="detail-row"><span class="detail-key">Year</span><span class="detail-val">${b.year || '—'}</span></div>
        <div class="detail-row"><span class="detail-key">ISBN</span><span class="detail-val td-mono">${esc(b.isbn || '—')}</span></div>
        <div class="detail-row"><span class="detail-key">Status</span>
          <span class="badge ${b.status === 'available' ? 'badge-green' : 'badge-red'}">
            <span class="badge-dot"></span>${b.status === 'available' ? 'Available' : 'Checked out'}
          </span>
        </div>
        ${b.description ? `<div class="detail-desc">${esc(b.description)}</div>` : ''}
      </div>`,
      `<button class="btn btn-outline btn-sm" onclick="closeModal()">Close</button>
       <button class="btn btn-primary btn-sm" onclick="closeModal();editBook(${b.id})">Edit</button>`);
  } catch (err) { toast(err.message, 'error'); }
}

async function openAddBook() {
  const html = await bookFormHTML();
  openModal('Add Book', html,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary btn-sm" id="save-btn">Add Book</button>`);
  $('save-btn').onclick = async () => {
    const d = getBookData();
    if (!d.title)     { showFerr('Title is required'); return; }
    if (!d.author_id) { showFerr('Please select an author'); return; }
    try {
      await API.books.create(d);
      closeModal(); toast('Book added'); renderBooks();
    } catch (err) { showFerr(err.message); }
  };
}

async function editBook(id) {
  try {
    const b = await API.books.get(id);
    const html = await bookFormHTML(b);
    openModal('Edit Book', html,
      `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancel</button>
       <button class="btn btn-primary btn-sm" id="save-btn">Save changes</button>`);
    $('save-btn').onclick = async () => {
      const d = getBookData();
      if (!d.title)     { showFerr('Title is required'); return; }
      if (!d.author_id) { showFerr('Please select an author'); return; }
      try {
        await API.books.update(id, d);
        closeModal(); toast('Changes saved'); renderBooks();
      } catch (err) { showFerr(err.message); }
    };
  } catch (err) { toast(err.message, 'error'); }
}

async function deleteBook(id) {
  try {
    const b = await API.books.get(id);
    openModal('Delete Book', `
      <div style="text-align:center;padding:.5rem 0">
        <div class="confirm-icon">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </div>
        <p class="confirm-title">Delete "${esc(b.title)}"?</p>
        <p class="confirm-desc">This action cannot be undone.</p>
      </div>`,
      `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancel</button>
       <button class="btn btn-danger btn-sm" id="conf-del">Delete</button>`);
    $('conf-del').onclick = async () => {
      try {
        await API.books.delete(id);
        closeModal(); toast('Book deleted'); renderBooks();
      } catch (err) { toast(err.message, 'error'); }
    };
  } catch (err) { toast(err.message, 'error'); }
}

async function renderAuthors() {
  const grid = $('authors-grid');
  grid.innerHTML = '<div style="color:var(--text3);font-size:.82rem;padding:2rem">Loading…</div>';
  try {
    const data = await API.authors.list();
    $('authors-count').textContent = `${data.length} author${data.length !== 1 ? 's' : ''}`;
    grid.innerHTML = '';
    if (data.length === 0) {
      grid.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><p>No authors yet</p></div>`;
      return;
    }
    const initials = n => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    data.forEach((a, i) => {
      const div = document.createElement('div');
      div.className = 'author-card anim-in';
      div.style.animationDelay = `${i * 0.04}s`;
      div.innerHTML = `
        <div class="author-avatar">${initials(a.name)}</div>
        <div class="author-name">${esc(a.name)}</div>
        <div class="author-meta">${a.birth_year ? `Born ${a.birth_year}. ` : ''}${a.bio ? esc(a.bio.slice(0, 60)) + '…' : ''}</div>
        <div class="author-footer">
          <span class="author-book-count">${a.book_count} book${a.book_count !== 1 ? 's' : ''}</span>
          <div class="author-actions">
            <button class="btn btn-ghost btn-sm btn-icon" data-action="edit" data-id="${a.id}" title="Edit">
              <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-danger btn-sm btn-icon" data-action="delete" data-id="${a.id}" title="Delete">
              <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
            </button>
          </div>
        </div>`;
      grid.appendChild(div);
    });
  } catch (err) {
    grid.innerHTML = `<div style="color:var(--red);font-size:.82rem;padding:2rem">${esc(err.message)}</div>`;
  }
}

$('authors-grid').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = +btn.dataset.id;
  if (btn.dataset.action === 'edit')   editAuthor(id);
  if (btn.dataset.action === 'delete') deleteAuthor(id);
});

function authorFormHTML(a = {}) {
  return `
    <div class="form-grid">
      <div class="field full">
        <label>Full Name <span style="color:var(--red)">*</span></label>
        <input id="f-name" value="${esc(a.name || '')}" placeholder="Author's full name"/>
      </div>
      <div class="field full">
        <label>Biography</label>
        <textarea id="f-bio" placeholder="Short bio…">${esc(a.bio || '')}</textarea>
      </div>
      <div class="field">
        <label>Birth Year</label>
        <input id="f-birth" type="number" value="${a.birth_year || ''}" placeholder="e.g. 1965"/>
      </div>
    </div>
    <div id="ferr" class="alert-error-inline hidden"></div>`;
}

function openAddAuthor() {
  openModal('Add Author', authorFormHTML(),
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary btn-sm" id="save-btn">Add Author</button>`);
  $('save-btn').onclick = async () => {
    const name = $('f-name').value.trim();
    if (!name) { showFerr('Name is required'); return; }
    try {
      await API.authors.create({ name, bio: $('f-bio').value.trim() || null, birth_year: $('f-birth').value || null });
      closeModal(); toast('Author added'); renderAuthors(); updateStats();
    } catch (err) { showFerr(err.message); }
  };
}

async function editAuthor(id) {
  try {
    const a = await API.authors.get(id);
    openModal('Edit Author', authorFormHTML(a),
      `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancel</button>
       <button class="btn btn-primary btn-sm" id="save-btn">Save changes</button>`);
    $('save-btn').onclick = async () => {
      const name = $('f-name').value.trim();
      if (!name) { showFerr('Name is required'); return; }
      try {
        await API.authors.update(id, { name, bio: $('f-bio').value.trim() || null, birth_year: $('f-birth').value || null });
        closeModal(); toast('Author updated'); renderAuthors();
      } catch (err) { showFerr(err.message); }
    };
  } catch (err) { toast(err.message, 'error'); }
}

async function deleteAuthor(id) {
  try {
    const a = await API.authors.get(id);
    openModal('Delete Author', `
      <div style="text-align:center;padding:.5rem 0">
        <div class="confirm-icon">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </div>
        <p class="confirm-title">Delete "${esc(a.name)}"?</p>
        <p class="confirm-desc">${a.books?.length > 0
          ? `This will also permanently delete <strong>${a.books.length} book${a.books.length !== 1 ? 's' : ''}</strong> by this author.`
          : 'This action cannot be undone.'}</p>
      </div>`,
      `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancel</button>
       <button class="btn btn-danger btn-sm" id="conf-del">Delete${a.books?.length > 0 ? ` author + ${a.books.length} book(s)` : ''}</button>`);
    $('conf-del').onclick = async () => {
      try {
        const result = await API.authors.delete(id);
        closeModal(); toast(`Author and ${result.deletedBooks} book(s) deleted`); renderAuthors(); updateStats();
      } catch (err) { toast(err.message, 'error'); }
    };
  } catch (err) { toast(err.message, 'error'); }
}

async function doExport(format) {
  const token = API.getToken();

  const response = await fetch(
    API.books.exportUrl(format),
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err);
  }

  const blob = await response.blob();

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `export.${format}`;

  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
}

$('login-btn').onclick = async () => {
  const u   = $('l-user').value.trim();
  const p   = $('l-pass').value;
  const err = $('login-err');
  err.classList.add('hidden');
  try {
    const data = await API.auth.login(u, p);
    API.setToken(data.token);
    API.setUser(data.user);
    $('login-screen').classList.add('hidden');
    $('app').classList.remove('hidden');
    $('uname').textContent   = data.user.username;
    $('uavatar').textContent = data.user.username[0].toUpperCase();
    renderBooks();
  } catch (e) {
    err.textContent = e.message;
    err.classList.remove('hidden');
  }
};

['l-user', 'l-pass'].forEach(id => {
  $(id).addEventListener('keydown', e => { if (e.key === 'Enter') $('login-btn').click(); });
});

$('logout-btn').onclick = async () => {
  try { await API.auth.logout(); } catch { /* ignore */ }
  API.clearToken();
  $('app').classList.add('hidden');
  $('login-screen').classList.remove('hidden');
};

$('add-book-btn').onclick   = openAddBook;
$('add-author-btn').onclick = openAddAuthor;

$('export-csv-btn').onclick  = () => doExport('csv');
$('export-json-btn').onclick = () => doExport('json');


['search-input', 'filter-author', 'filter-genre', 'sort-select'].forEach(id => {
  $(id).addEventListener('input',  () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(renderBooks, 220); });
  $(id).addEventListener('change', () => renderBooks());
});

(async () => {
  const token = API.getToken();
  const user  = API.getUser();
  if (token && user) {
    try {
      await API.auth.me(); // verify token is still valid
      $('login-screen').classList.add('hidden');
      $('app').classList.remove('hidden');
      $('uname').textContent   = user.username;
      $('uavatar').textContent = user.username[0].toUpperCase();
      renderBooks();
    } catch {
      API.clearToken();
    }
  }
})();
