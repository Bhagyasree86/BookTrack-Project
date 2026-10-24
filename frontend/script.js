/* ========================================================
   BookTrack – Frontend Application Logic (Member 1)
   Supports:
   1. Live Spring Boot REST APIs (Member 2 backend on port 8081)
   2. Seamless Demo Mode with rich sample data in localStorage
      (Requirement 10: "Initially use sample data to test the interface. Later, connect it to the backend APIs.")
   ======================================================== */

const DEFAULT_API_BASE = 'http://localhost:8081/api';
let API_BASE_URL = window.BOOKTRACK_API_URL || localStorage.getItem('booktrack_api_url') || DEFAULT_API_BASE;

// Default rich sample data matching Member 3 database schema
const INITIAL_SAMPLE_DATA = {
  books: [
    { id: 1, title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', isbn: '9780132350884', category: 'Computer Science', quantity: 8, availableCopies: 7 },
    { id: 2, title: 'The Pragmatic Programmer: Your Journey to Mastery', author: 'Andrew Hunt & David Thomas', isbn: '9780201616224', category: 'Computer Science', quantity: 5, availableCopies: 4 },
    { id: 3, title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Erich Gamma et al.', isbn: '9780201633610', category: 'Software Engineering', quantity: 6, availableCopies: 6 },
    { id: 4, title: 'Introduction to Algorithms (CLRS)', author: 'Thomas H. Cormen', isbn: '9780262033848', category: 'Algorithms', quantity: 10, availableCopies: 8 },
    { id: 5, title: 'Continuous Delivery: Reliable Software Releases', author: 'Jez Humble & David Farley', isbn: '9780321601919', category: 'DevOps', quantity: 4, availableCopies: 3 },
    { id: 6, title: 'Spring in Action (6th Edition)', author: 'Craig Walls', isbn: '9781617297571', category: 'Technology', quantity: 7, availableCopies: 7 }
  ],
  students: [
    { id: 1, name: 'Aarav Sharma', email: 'aarav.sharma@university.edu', department: 'Computer Science' },
    { id: 2, name: 'Diya Patel', email: 'diya.patel@university.edu', department: 'Information Technology' },
    { id: 3, name: 'Rohan Verma', email: 'rohan.verma@university.edu', department: 'Electronics & Comm.' },
    { id: 4, name: 'Ananya Iyer', email: 'ananya.iyer@university.edu', department: 'Computer Science' }
  ],
  loans: [
    { id: 1, book: { id: 1, title: 'Clean Code: A Handbook of Agile Software Craftsmanship' }, student: { id: 1, name: 'Aarav Sharma', email: 'aarav.sharma@university.edu' }, issueDate: '2026-10-17', dueDate: '2026-10-31', returnDate: null, status: 'ISSUED' },
    { id: 2, book: { id: 2, title: 'The Pragmatic Programmer: Your Journey to Mastery' }, student: { id: 2, name: 'Diya Patel', email: 'diya.patel@university.edu' }, issueDate: '2026-10-12', dueDate: '2026-10-26', returnDate: null, status: 'ISSUED' },
    { id: 3, book: { id: 4, title: 'Introduction to Algorithms (CLRS)' }, student: { id: 3, name: 'Rohan Verma', email: 'rohan.verma@university.edu' }, issueDate: '2026-10-01', dueDate: '2026-10-15', returnDate: null, status: 'OVERDUE' },
    { id: 4, book: { id: 5, title: 'Continuous Delivery: Reliable Software Releases' }, student: { id: 4, name: 'Ananya Iyer', email: 'ananya.iyer@university.edu' }, issueDate: '2026-10-05', dueDate: '2026-10-19', returnDate: '2026-10-18', status: 'RETURNED' }
  ]
};

const state = {
  books: [],
  students: [],
  loans: [],
  currentPage: 'dashboard',
  confirmAction: null,
  isDemoMode: false,
  selectedCategory: 'ALL'
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

const number = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const dateText = (value) => {
  if (!value) return '—';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? escapeHtml(value)
    : date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const initials = (name) =>
  String(name || 'ST')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase();

const bookOf = (loan) => loan.book || loan.bookDetails || {};
const studentOf = (loan) => loan.student || loan.studentDetails || {};
const isReturned = (loan) => String(loan.status || '').toUpperCase() === 'RETURNED' || Boolean(loan.returnDate);
const isOverdue = (loan) => !isReturned(loan) && loan.dueDate && loan.dueDate < new Date().toISOString().slice(0, 10);

/* --- Toast Notifications --- */
function notify(message, type = 'success') {
  const region = $('#toastRegion');
  if (!region) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  region.append(toast);
  window.setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4200);
}

/* --- Connection & Demo Mode UI Status --- */
function setConnection(online, message, isDemo = false) {
  state.isDemoMode = isDemo;
  const dot = $('#connectionDot');
  const text = $('#connectionText');
  const demoBanner = $('#demoBanner');

  if (dot) {
    dot.className = 'connection-dot ' + (isDemo ? 'demo' : online ? 'online' : 'offline');
  }
  if (text) {
    text.textContent = message;
  }
  if (demoBanner) {
    demoBanner.classList.toggle('hidden', !isDemo);
  }
}

/* --- Demo Storage Helpers --- */
function getDemoData() {
  try {
    const raw = localStorage.getItem('booktrack_demo_data');
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading demo data from localStorage', err);
  }
  saveDemoData(INITIAL_SAMPLE_DATA);
  return JSON.parse(JSON.stringify(INITIAL_SAMPLE_DATA));
}

function saveDemoData(data) {
  try {
    localStorage.setItem('booktrack_demo_data', JSON.stringify(data));
  } catch (err) {
    console.warn('Error saving demo data to localStorage', err);
  }
}

function resetDemoData() {
  saveDemoData(INITIAL_SAMPLE_DATA);
  state.books = JSON.parse(JSON.stringify(INITIAL_SAMPLE_DATA.books));
  state.students = JSON.parse(JSON.stringify(INITIAL_SAMPLE_DATA.students));
  state.loans = JSON.parse(JSON.stringify(INITIAL_SAMPLE_DATA.loans));
  renderAll();
  notify('Sample data reset to default catalog.');
}

/* --- Unified API / Data Provider Layer --- */
async function api(path, options = {}) {
  // If explicitly in Demo mode, route to local mock handler
  if (state.isDemoMode) {
    return handleMockRequest(path, options);
  }

  // Live HTTP request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let detail = '';
      try {
        detail = (await response.text()).trim();
      } catch (_) {}
      const messages = {
        400: 'Please verify the submitted details.',
        404: 'The requested record was not found.',
        409: 'This record conflicts with an existing entry (e.g. duplicate email).',
        500: 'The backend server encountered an error.'
      };
      throw new Error(detail || messages[response.status] || `Request failed (${response.status}).`);
    }

    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/* --- Mock Request Handler for Standalone Demo Mode (Member 1 Req #10) --- */
function handleMockRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const demo = getDemoData();

  // Books endpoints
  if (path === '/books' && method === 'GET') {
    return demo.books;
  }
  if (path.startsWith('/books/search') && method === 'GET') {
    const url = new URL(path, 'http://dummy.com');
    const keyword = (url.searchParams.get('keyword') || '').toLowerCase();
    return demo.books.filter((b) => `${b.title} ${b.author} ${b.isbn} ${b.category}`.toLowerCase().includes(keyword));
  }
  if (path === '/books' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const newBook = {
      id: Date.now(),
      title: body.title,
      author: body.author,
      isbn: body.isbn,
      category: body.category || 'General',
      quantity: Number(body.quantity) || 1,
      availableCopies: Number(body.availableCopies) || Number(body.quantity) || 1
    };
    demo.books.push(newBook);
    saveDemoData(demo);
    return newBook;
  }
  if (path.startsWith('/books/') && method === 'PUT') {
    const id = Number(path.replace('/books/', ''));
    const body = JSON.parse(options.body || '{}');
    const index = demo.books.findIndex((b) => Number(b.id) === id);
    if (index === -1) throw new Error('Book not found');
    demo.books[index] = {
      ...demo.books[index],
      title: body.title,
      author: body.author,
      isbn: body.isbn,
      category: body.category,
      quantity: Number(body.quantity),
      availableCopies: Number(body.availableCopies)
    };
    saveDemoData(demo);
    return demo.books[index];
  }
  if (path.startsWith('/books/') && method === 'DELETE') {
    const id = Number(path.replace('/books/', ''));
    demo.books = demo.books.filter((b) => Number(b.id) !== id);
    saveDemoData(demo);
    return null;
  }

  // Students endpoints
  if (path === '/students' && method === 'GET') {
    return demo.students;
  }
  if (path === '/students' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    if (demo.students.some((s) => s.email.toLowerCase() === (body.email || '').toLowerCase())) {
      throw new Error('A student with this email address already exists.');
    }
    const newStudent = {
      id: demo.students.length ? Math.max(...demo.students.map((s) => Number(s.id))) + 1 : 1,
      name: body.name,
      email: body.email,
      department: body.department
    };
    demo.students.push(newStudent);
    saveDemoData(demo);
    return newStudent;
  }

  // Borrow Records endpoints
  if (path === '/borrow-records' && method === 'GET') {
    return demo.loans;
  }
  if (path === '/borrow-records/issue' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const book = demo.books.find((b) => Number(b.id) === Number(body.bookId));
    const student = demo.students.find((s) => Number(s.id) === Number(body.studentId));
    if (!book) throw new Error('Selected book not found');
    if (!student) throw new Error('Selected student not found');
    if (book.availableCopies <= 0) throw new Error('This book is currently out of stock!');

    // Decrement availability
    book.availableCopies -= 1;

    const newLoan = {
      id: Date.now(),
      book: { id: book.id, title: book.title },
      student: { id: student.id, name: student.name, email: student.email },
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: body.dueDate,
      returnDate: null,
      status: 'ISSUED'
    };
    demo.loans.push(newLoan);
    saveDemoData(demo);
    return newLoan;
  }
  if (path.startsWith('/borrow-records/') && path.endsWith('/return') && method === 'POST') {
    const id = Number(path.replace('/borrow-records/', '').replace('/return', ''));
    const loan = demo.loans.find((l) => Number(l.id) === id);
    if (!loan) throw new Error('Borrow record not found');
    if (isReturned(loan)) throw new Error('This book has already been returned.');

    loan.returnDate = new Date().toISOString().slice(0, 10);
    loan.status = 'RETURNED';

    // Increment availability
    const bookId = Number(loan.book?.id);
    const book = demo.books.find((b) => Number(b.id) === bookId);
    if (book && book.availableCopies < book.quantity) {
      book.availableCopies += 1;
    }
    saveDemoData(demo);
    return loan;
  }

  throw new Error(`Endpoint not mapped: ${method} ${path}`);
}

/* --- Load Data (with Automatic Live vs Demo Detection) --- */
async function loadAll({ quiet = false, forceDemo = false } = {}) {
  if (forceDemo) {
    state.isDemoMode = true;
    const demo = getDemoData();
    state.books = demo.books;
    state.students = demo.students;
    state.loans = demo.loans;
    setConnection(false, 'Demo Mode (Sample Data)', true);
    renderAll();
    if (!quiet) notify('Switched to Demo Mode (using sample data).', 'info');
    return;
  }

  // Attempt live connection first
  try {
    state.isDemoMode = false;
    const [books, students, loans] = await Promise.all([
      api('/books'),
      api('/students'),
      api('/borrow-records')
    ]);

    state.books = Array.isArray(books) ? books : [];
    state.students = Array.isArray(students) ? students : [];
    state.loans = Array.isArray(loans) ? loans : [];

    setConnection(true, 'Live Backend Connected (Port 8081)', false);
    renderAll();
    if (!quiet) notify('Library records synchronized with backend.');
  } catch (error) {
    console.info('Backend not reachable at', API_BASE_URL, '- Falling back to rich Demo Mode.');
    state.isDemoMode = true;
    const demo = getDemoData();
    state.books = demo.books;
    state.students = demo.students;
    state.loans = demo.loans;

    setConnection(false, 'Demo Mode (Backend Offline)', true);
    renderAll();
    if (!quiet) {
      notify(`Backend offline. Running in Demo Mode with interactive sample data.`, 'info');
    }
  }
}

/* --- Render Functions --- */
function renderAll() {
  renderDashboard();
  renderBooks();
  renderStudents();
  renderLoans();
  populateSelects();
}

function renderDashboard() {
  const totalQuantity = state.books.reduce((sum, book) => sum + number(book.quantity), 0);
  const available = state.books.reduce((sum, book) => sum + number(book.availableCopies), 0);
  const issued = state.loans.filter((loan) => !isReturned(loan)).length;

  $('#statBooks').textContent = state.books.length;
  $('#statAvailable').textContent = available;
  $('#statStudents').textContent = state.students.length;
  $('#statIssued').textContent = issued;
  $('#loanSummaryCount').textContent = issued;

  // Recent books table (latest 5)
  const recent = [...state.books].slice(-5).reverse();
  const recentTbody = $('#recentBooks');
  if (recentTbody) {
    recentTbody.innerHTML = recent.length
      ? recent
          .map((book, index) => {
            const avail = number(book.availableCopies);
            const badgeClass = avail === 0 ? 'out' : avail < 3 ? 'low' : 'ok';
            const badgeText = avail === 0 ? 'Out of stock' : `${avail} / ${number(book.quantity)}`;
            return `
        <tr>
          <td>
            <div class="book-cell">
              <div class="book-cover cover-${index % 4}">
                ${escapeHtml((book.title || 'B').trim().charAt(0).toUpperCase())}
              </div>
              <div>
                <div class="book-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</div>
                <div class="book-author">${escapeHtml(book.author)}</div>
              </div>
            </div>
          </td>
          <td><span class="category-tag">${escapeHtml(book.category || 'General')}</span></td>
          <td><span class="availability-pill ${badgeClass}">${badgeText}</span></td>
        </tr>`;
          })
          .join('')
      : '<tr><td colspan="3" class="empty-cell">No books found in the collection.</td></tr>';
  }
}

function renderBooks() {
  const keyword = ($('#bookSearch')?.value || '').trim().toLowerCase();
  const selectedCat = state.selectedCategory || 'ALL';

  const books = state.books.filter((book) => {
    const matchesKeyword = `${book.title || ''} ${book.author || ''} ${book.isbn || ''} ${book.category || ''}`
      .toLowerCase()
      .includes(keyword);
    const matchesCategory = selectedCat === 'ALL' || (book.category || 'General').toUpperCase() === selectedCat.toUpperCase();
    return matchesKeyword && matchesCategory;
  });

  const countBadge = $('#bookCount');
  if (countBadge) countBadge.textContent = books.length;

  const footer = $('#booksFooter');
  if (footer) footer.textContent = `Showing ${books.length} of ${state.books.length} book title${state.books.length === 1 ? '' : 's'}`;

  const table = $('#booksTable');
  if (!table) return;

  table.innerHTML = books.length
    ? books
        .map((book, index) => {
          const avail = number(book.availableCopies);
          const badgeClass = avail === 0 ? 'out' : avail < 3 ? 'low' : 'ok';
          return `
      <tr>
        <td>
          <div class="book-cell">
            <div class="book-cover cover-${index % 4}">
              ${escapeHtml((book.title || 'B').trim().charAt(0).toUpperCase())}
            </div>
            <div>
              <div class="book-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</div>
              <div class="book-author">by ${escapeHtml(book.author)}</div>
            </div>
          </div>
        </td>
        <td><code>${escapeHtml(book.isbn || '—')}</code></td>
        <td><span class="category-tag">${escapeHtml(book.category || 'General')}</span></td>
        <td><strong>${number(book.quantity)}</strong></td>
        <td><span class="availability-pill ${badgeClass}">${avail} available</span></td>
        <td>
          <div class="row-actions">
            <button class="small-action" data-edit-book="${escapeHtml(book.id)}" title="Edit book details">Edit</button>
            <button class="small-action danger" data-delete-book="${escapeHtml(book.id)}" title="Delete book">Delete</button>
          </div>
        </td>
      </tr>`;
        })
        .join('')
    : `<tr><td colspan="6" class="empty-cell">${keyword ? 'No books match your search criteria.' : 'No books in this category.'}</td></tr>`;
}

function renderStudents() {
  const keyword = ($('#studentSearch')?.value || '').trim().toLowerCase();
  const students = state.students.filter((student) =>
    `${student.name || ''} ${student.email || ''} ${student.department || ''} ${student.id || ''}`
      .toLowerCase()
      .includes(keyword)
  );

  const countBadge = $('#studentCount');
  if (countBadge) countBadge.textContent = students.length;

  const table = $('#studentsTable');
  if (!table) return;

  table.innerHTML = students.length
    ? students
        .map(
          (student) => `
      <tr>
        <td>
          <div class="student-cell">
            <div class="student-initial">${escapeHtml(initials(student.name))}</div>
            <div>
              <div class="student-name">${escapeHtml(student.name)}</div>
              <small class="student-sub">ID: #${escapeHtml(student.id)}</small>
            </div>
          </div>
        </td>
        <td><a href="mailto:${escapeHtml(student.email)}" class="email-link">${escapeHtml(student.email)}</a></td>
        <td><span class="category-tag">${escapeHtml(student.department)}</span></td>
        <td class="student-id">#${escapeHtml(student.id)}</td>
      </tr>`
        )
        .join('')
    : `<tr><td colspan="4" class="empty-cell">${keyword ? 'No students match your search.' : 'No students registered yet.'}</td></tr>`;
}

function renderLoans() {
  const keyword = ($('#loanSearch')?.value || '').trim().toLowerCase();
  const loans = [...state.loans]
    .filter((loan) => {
      const book = bookOf(loan);
      const student = studentOf(loan);
      return `${book.title || ''} ${student.name || ''} ${student.email || ''} ${loan.status || ''} ${loan.id || ''}`
        .toLowerCase()
        .includes(keyword);
    })
    .reverse();

  const countBadge = $('#loanCount');
  if (countBadge) countBadge.textContent = loans.length;

  const summaryCount = $('#loanSummaryCount');
  if (summaryCount) summaryCount.textContent = state.loans.filter((loan) => !isReturned(loan)).length;

  const table = $('#loansTable');
  if (!table) return;

  table.innerHTML = loans.length
    ? loans
        .map((loan) => {
          const book = bookOf(loan);
          const student = studentOf(loan);
          const returned = isReturned(loan);
          const overdue = isOverdue(loan);
          const status = returned ? 'RETURNED' : overdue ? 'OVERDUE' : (loan.status || 'ISSUED').toUpperCase();
          const statusClass = status.toLowerCase();

          return `
      <tr>
        <td>
          <div class="book-title" title="${escapeHtml(book.title || '')}">${escapeHtml(book.title || `Book #${book.id ?? '—'}`)}</div>
          <div class="book-author">Loan ID: #${escapeHtml(loan.id)}</div>
        </td>
        <td>
          <div class="book-title">${escapeHtml(student.name || `Student #${student.id ?? '—'}`)}</div>
          <div class="book-author">${escapeHtml(student.email || '')}</div>
        </td>
        <td>${dateText(loan.issueDate)}</td>
        <td><strong>${dateText(loan.dueDate)}</strong></td>
        <td><span class="status-tag ${statusClass}">${escapeHtml(status)}</span></td>
        <td>
          ${
            returned
              ? `<span class="badge-returned-date">Returned on ${dateText(loan.returnDate || loan.updatedAt)}</span>`
              : `<button class="button-return" data-return-loan="${escapeHtml(loan.id)}" title="Confirm return of this book">⇄ Mark Returned</button>`
          }
        </td>
      </tr>`;
        })
        .join('')
    : `<tr><td colspan="6" class="empty-cell">${keyword ? 'No loan records match your search.' : 'No active borrowing records.'}</td></tr>`;
}

function populateSelects() {
  const bookSelect = $('#issueBookId');
  const studentSelect = $('#issueStudentId');
  if (!bookSelect || !studentSelect) return;

  const selectedBook = bookSelect.value;
  const selectedStudent = studentSelect.value;

  const availableBooks = state.books.filter((b) => number(b.availableCopies) > 0);

  bookSelect.innerHTML =
    '<option value="">-- Select an available book --</option>' +
    availableBooks
      .map((b) => `<option value="${escapeHtml(b.id)}">${escapeHtml(b.title)} (${number(b.availableCopies)} copies available)</option>`)
      .join('');

  studentSelect.innerHTML =
    '<option value="">-- Select a registered student --</option>' +
    state.students
      .map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} — ${escapeHtml(s.department)} (#${escapeHtml(s.id)})</option>`)
      .join('');

  if ([...bookSelect.options].some((opt) => opt.value === selectedBook)) bookSelect.value = selectedBook;
  if ([...studentSelect.options].some((opt) => opt.value === selectedStudent)) studentSelect.value = selectedStudent;
}

/* --- Page Navigation --- */
function showPage(page) {
  if (!['dashboard', 'books', 'students', 'loans'].includes(page)) return;
  state.currentPage = page;
  $$('.page').forEach((sec) => sec.classList.toggle('active', sec.id === `page-${page}`));
  $$('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.page === page));

  const pageNames = {
    dashboard: 'Dashboard',
    books: 'Book Management',
    students: 'Student Directory',
    loans: 'Issue & Return'
  };
  const crumb = $('#pageCrumb');
  if (crumb) crumb.textContent = pageNames[page] || 'Dashboard';

  const sidebar = $('#sidebar');
  if (sidebar) sidebar.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* --- Forms & Modals --- */
function openBookForm(book = null) {
  $('#bookForm').reset();
  $('#bookId').value = book?.id ?? '';
  $('#bookFormTitle').textContent = book ? 'Update Book Details' : 'Add a New Book';
  $('#saveBookButton').textContent = book ? 'Update Book' : 'Save Book';
  $('#bookTitle').value = book?.title ?? '';
  $('#bookAuthor').value = book?.author ?? '';
  $('#bookIsbn').value = book?.isbn ?? '';
  $('#bookCategory').value = book?.category ?? '';
  $('#bookQuantity').value = book?.quantity ?? 1;
  $('#bookAvailable').value = book?.availableCopies ?? 1;

  const panel = $('#bookFormPanel');
  panel.classList.remove('hidden');
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('#bookTitle').focus({ preventScroll: true });
}

function closeBookForm() {
  $('#bookFormPanel').classList.add('hidden');
  $('#bookForm').reset();
  $('#bookId').value = '';
}

function openStudentForm() {
  $('#studentForm').reset();
  const panel = $('#studentFormPanel');
  panel.classList.remove('hidden');
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('#studentName').focus({ preventScroll: true });
}

function closeStudentForm() {
  $('#studentFormPanel').classList.add('hidden');
  $('#studentForm').reset();
}

function openIssueForm() {
  populateSelects();
  $('#issueForm').reset();
  const today = new Date().toISOString().slice(0, 10);
  const due = new Date();
  due.setDate(due.getDate() + 14);

  const dueInput = $('#issueDueDate');
  dueInput.min = today;
  dueInput.value = due.toISOString().slice(0, 10);

  const panel = $('#issueFormPanel');
  panel.classList.remove('hidden');
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeIssueForm() {
  $('#issueFormPanel').classList.add('hidden');
  $('#issueForm').reset();
}

function askConfirm({ title, message, acceptLabel = 'Confirm', action }) {
  $('#confirmTitle').textContent = title;
  $('#confirmMessage').textContent = message;
  $('#confirmAccept').textContent = acceptLabel;
  state.confirmAction = action;
  $('#confirmBackdrop').classList.remove('hidden');
  $('#confirmAccept').focus();
}

function closeConfirm() {
  $('#confirmBackdrop').classList.add('hidden');
  state.confirmAction = null;
}

/* --- Form Submit Event Listeners --- */
$('#bookForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = $('#bookId').value;
  const quantity = Number($('#bookQuantity').value);
  const availableCopies = Number($('#bookAvailable').value);

  if (availableCopies > quantity) {
    return notify('Available copies cannot exceed the total quantity.', 'error');
  }

  const payload = {
    title: $('#bookTitle').value.trim(),
    author: $('#bookAuthor').value.trim(),
    isbn: $('#bookIsbn').value.trim(),
    category: $('#bookCategory').value.trim() || 'General',
    quantity,
    availableCopies
  };

  const button = $('#saveBookButton');
  button.disabled = true;
  button.textContent = 'Saving…';

  try {
    if (state.isDemoMode) {
      handleMockRequest(id ? `/books/${encodeURIComponent(id)}` : '/books', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      closeBookForm();
      await loadAll({ quiet: true, forceDemo: true });
      notify(id ? 'Book updated successfully (Demo Mode).' : 'Book added successfully (Demo Mode).');
    } else {
      await api(id ? `/books/${encodeURIComponent(id)}` : '/books', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      closeBookForm();
      await loadAll({ quiet: true });
      notify(id ? 'Book updated successfully in database.' : 'Book saved successfully in database.');
    }
  } catch (error) {
    notify(`Could not save book: ${error.message}`, 'error');
  } finally {
    button.disabled = false;
    button.textContent = id ? 'Update Book' : 'Save Book';
  }
});

$('#studentForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    name: $('#studentName').value.trim(),
    email: $('#studentEmail').value.trim(),
    department: $('#studentDepartment').value.trim()
  };

  try {
    if (state.isDemoMode) {
      handleMockRequest('/students', { method: 'POST', body: JSON.stringify(payload) });
      closeStudentForm();
      await loadAll({ quiet: true, forceDemo: true });
      notify('Student registered successfully (Demo Mode).');
    } else {
      await api('/students', { method: 'POST', body: JSON.stringify(payload) });
      closeStudentForm();
      await loadAll({ quiet: true });
      notify('Student registered successfully in database.');
    }
  } catch (error) {
    notify(`Could not register student: ${error.message}`, 'error');
  }
});

$('#issueForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const bookId = $('#issueBookId').value;
  const studentId = $('#issueStudentId').value;
  const dueDate = $('#issueDueDate').value;

  if (!bookId || !studentId || !dueDate) {
    return notify('Please select a book, a student, and a valid due date.', 'error');
  }

  const payload = { bookId: Number(bookId), studentId: Number(studentId), dueDate };

  try {
    if (state.isDemoMode) {
      handleMockRequest('/borrow-records/issue', { method: 'POST', body: JSON.stringify(payload) });
      closeIssueForm();
      await loadAll({ quiet: true, forceDemo: true });
      notify('Book issued successfully! Available copies updated.');
    } else {
      await api('/borrow-records/issue', { method: 'POST', body: JSON.stringify(payload) });
      closeIssueForm();
      await loadAll({ quiet: true });
      notify('Book issued successfully! Backend database updated.');
    }
  } catch (error) {
    notify(`Could not issue book: ${error.message}`, 'error');
  }
});

/* --- Table Click Actions (Edit, Delete, Return) --- */
$('#booksTable').addEventListener('click', (event) => {
  const edit = event.target.closest('[data-edit-book]');
  const remove = event.target.closest('[data-delete-book]');

  if (edit) {
    const book = state.books.find((b) => String(b.id) === edit.dataset.editBook);
    if (book) openBookForm(book);
  }

  if (remove) {
    const book = state.books.find((b) => String(b.id) === remove.dataset.deleteBook);
    if (!book) return;

    askConfirm({
      title: 'Delete this book?',
      message: `“${book.title}” will be permanently removed from the library catalog. This action cannot be undone.`,
      acceptLabel: 'Delete Book',
      action: async () => {
        try {
          if (state.isDemoMode) {
            handleMockRequest(`/books/${encodeURIComponent(book.id)}`, { method: 'DELETE' });
            await loadAll({ quiet: true, forceDemo: true });
            notify('Book deleted from catalog (Demo Mode).');
          } else {
            await api(`/books/${encodeURIComponent(book.id)}`, { method: 'DELETE' });
            await loadAll({ quiet: true });
            notify('Book deleted from database.');
          }
        } catch (error) {
          notify(`Could not delete book: ${error.message}`, 'error');
        }
      }
    });
  }
});

$('#loansTable').addEventListener('click', (event) => {
  const returnBtn = event.target.closest('[data-return-loan]');
  if (!returnBtn) return;
  const id = returnBtn.dataset.returnLoan;

  askConfirm({
    title: 'Confirm Book Return?',
    message: 'This will record the return date, mark the borrowing status as RETURNED, and increment the available copies in the catalog.',
    acceptLabel: 'Confirm Return',
    action: async () => {
      try {
        if (state.isDemoMode) {
          handleMockRequest(`/borrow-records/${encodeURIComponent(id)}/return`, { method: 'POST' });
          await loadAll({ quiet: true, forceDemo: true });
          notify('Book return recorded! Catalog availability increased.');
        } else {
          await api(`/borrow-records/${encodeURIComponent(id)}/return`, { method: 'POST' });
          await loadAll({ quiet: true });
          notify('Book return recorded! Database availability updated.');
        }
      } catch (error) {
        notify(`Could not record return: ${error.message}`, 'error');
      }
    }
  });
});

/* --- UI Controls & Event Listeners --- */
$$('[data-page]').forEach((btn) => btn.addEventListener('click', () => showPage(btn.dataset.page)));

$$('[data-go]').forEach((btn) =>
  btn.addEventListener('click', () => {
    showPage(btn.dataset.go);
    if (btn.dataset.action === 'add-book') openBookForm();
    if (btn.dataset.action === 'add-student') openStudentForm();
    if (btn.dataset.action === 'issue-book') openIssueForm();
  })
);

$('#showBookForm').addEventListener('click', () => openBookForm());
$('#cancelBookForm').addEventListener('click', closeBookForm);
$('#cancelBookForm2').addEventListener('click', closeBookForm);

$('#showStudentForm').addEventListener('click', openStudentForm);
$('#cancelStudentForm').addEventListener('click', closeStudentForm);
$('#cancelStudentForm2').addEventListener('click', closeStudentForm);

$('#showIssueForm').addEventListener('click', openIssueForm);
$('#cancelIssueForm').addEventListener('click', closeIssueForm);
$('#cancelIssueForm2').addEventListener('click', closeIssueForm);

$('#confirmCancel').addEventListener('click', closeConfirm);
$('#confirmBackdrop').addEventListener('click', (e) => {
  if (e.target === $('#confirmBackdrop')) closeConfirm();
});
$('#confirmAccept').addEventListener('click', async () => {
  const action = state.confirmAction;
  closeConfirm();
  if (action) await action();
});

// Search & Filtering
$('#bookSearch').addEventListener('input', renderBooks);
$('#studentSearch').addEventListener('input', renderStudents);
$('#loanSearch').addEventListener('input', renderLoans);
$('#clearBookSearch')?.addEventListener('click', () => {
  $('#bookSearch').value = '';
  renderBooks();
  $('#bookSearch').focus();
});

$('#refreshDashboard')?.addEventListener('click', () => loadAll());

// Category pills filter
$$('.cat-filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.cat-filter').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedCategory = btn.dataset.category || 'ALL';
    renderBooks();
  });
});

// Toggle Demo Mode / Live Mode button
$('#toggleModeBtn')?.addEventListener('click', () => {
  if (state.isDemoMode) {
    loadAll({ quiet: false });
  } else {
    loadAll({ quiet: false, forceDemo: true });
  }
});

// Reset Demo Data button
$('#resetDemoBtn')?.addEventListener('click', resetDemoData);

// Mobile Sidebar
$('#mobileMenu')?.addEventListener('click', () => $('#sidebar').classList.toggle('open'));

// Keyboard escape handler
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeConfirm();
    closeBookForm();
    closeStudentForm();
    closeIssueForm();
    $('#sidebar').classList.remove('open');
  }
});

// Footer year
const yearSpan = $('#currentYear');
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// Initial load (attempts live backend, falls back gracefully to rich demo mode)
loadAll({ quiet: true });
