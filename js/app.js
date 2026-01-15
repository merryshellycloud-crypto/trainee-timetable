/**
 * Trainee Timetable Application
 * A simple web application for managing trainee schedules
 */

// Application State
const state = {
    trainees: [],
    sessions: [],
    dayBookings: [], // New: day bookings for monthly view
    currentWeekStart: getWeekStart(new Date()),
    currentMonth: new Date(),
    currentView: 'week', // 'week' or 'month'
    editingTraineeId: null,
    editingSessionId: null,
    editingBookingId: null
};

// Time slots for the timetable (8 AM to 6 PM)
const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Weekend days (non-editable)
const WEEKEND_DAYS = [5, 6]; // Saturday = 5, Sunday = 6

// Bulgarian Public Holidays 2026 with descriptions
const HOLIDAYS_2026 = {
    '2026-01-01': {
        name: 'New Year\'s Day',
        short: 'NY',
        description: 'Celebrates the beginning of the new calendar year. Bulgarians welcome the new year with festive gatherings, fireworks, and traditional meals.'
    },
    '2026-03-03': {
        name: 'Liberation Day',
        short: 'LD',
        description: 'Bulgaria\'s National Day commemorating liberation from Ottoman rule in 1878. The Treaty of San Stefano ended nearly 500 years of Ottoman domination.'
    },
    '2026-04-17': {
        name: 'Good Friday',
        short: 'GF',
        description: 'Orthodox Christian holy day marking the crucifixion of Jesus Christ. A solemn day of fasting and reflection before Easter.'
    },
    '2026-04-18': {
        name: 'Holy Saturday',
        short: 'HS',
        description: 'The day between Good Friday and Easter Sunday. Bulgarians prepare Easter eggs and traditional kozunak bread.'
    },
    '2026-04-19': {
        name: 'Easter Sunday',
        short: 'ES',
        description: 'The most important Orthodox Christian holiday celebrating Christ\'s resurrection. Families gather for festive meals and egg-cracking traditions.'
    },
    '2026-04-20': {
        name: 'Easter Monday',
        short: 'EM',
        description: 'Continuation of Easter celebrations. A day for family visits, sharing Easter meals, and enjoying the spring weather.'
    },
    '2026-05-01': {
        name: 'Labour Day',
        short: 'LabD',
        description: 'International Workers\' Day celebrating the achievements of workers worldwide. Many Bulgarians enjoy outdoor activities and picnics.'
    },
    '2026-05-06': {
        name: 'St. George\'s Day',
        short: 'SGD',
        description: 'Also known as Bulgarian Army Day. Honors St. George, patron saint of the military. Traditional lamb dishes are prepared on this day.'
    },
    '2026-05-24': {
        name: 'Education & Culture Day',
        short: 'ED',
        description: 'Celebrates Saints Cyril and Methodius who created the Cyrillic alphabet. A day honoring Bulgarian education, culture, and Slavic heritage.'
    },
    '2026-09-06': {
        name: 'Unification Day',
        short: 'UD',
        description: 'Commemorates the unification of Eastern Rumelia with the Principality of Bulgaria in 1885. A milestone in Bulgarian national unity.'
    },
    '2026-09-22': {
        name: 'Independence Day',
        short: 'ID',
        description: 'Marks Bulgaria\'s declaration of full independence from the Ottoman Empire in 1908. Celebrated with official ceremonies and cultural events.'
    },
    '2026-12-24': {
        name: 'Christmas Eve',
        short: 'CE',
        description: 'Badni Vecher - a sacred family evening with traditional meatless dinner of odd-numbered dishes. Families gather to share blessings.'
    },
    '2026-12-25': {
        name: 'Christmas Day',
        short: 'XM',
        description: 'Celebrates the birth of Jesus Christ. Bulgarian Christmas traditions include caroling, festive meals, and family gatherings.'
    },
    '2026-12-26': {
        name: 'Christmas Day 2',
        short: 'XM2',
        description: 'Second day of Christmas celebrations. Continued family visits, festive meals, and holiday traditions across Bulgaria.'
    }
};

// Function to check if a date is a holiday
function getHoliday(date) {
    // Use local date to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return HOLIDAYS_2026[dateStr] || null;
}

// Storage Keys
const STORAGE_KEYS = {
    TRAINEES: 'trainee_timetable_trainees',
    SESSIONS: 'trainee_timetable_sessions',
    DAY_BOOKINGS: 'trainee_timetable_day_bookings'
};

// Constants
const MAX_WEEKLY_HOURS = 20;

// Initialize Application
document.addEventListener('DOMContentLoaded', init);

function init() {
    loadData();
    renderCurrentView();
    renderTraineeList();
    updatePeriodDisplay();
    bindEvents();
}

// Render based on current view
function renderCurrentView() {
    if (state.currentView === 'week') {
        document.getElementById('weekView').classList.remove('hidden');
        document.getElementById('monthView').classList.add('hidden');
        renderTimetable();
    } else {
        document.getElementById('weekView').classList.add('hidden');
        document.getElementById('monthView').classList.remove('hidden');
        renderMonthView();
    }
}

// Switch view mode
function switchView(view) {
    state.currentView = view;

    // Update button states
    document.getElementById('weekViewBtn').classList.toggle('active', view === 'week');
    document.getElementById('monthViewBtn').classList.toggle('active', view === 'month');

    // Update navigation labels
    document.getElementById('prevLabel').textContent = view === 'week' ? 'Previous Week' : 'Previous Month';
    document.getElementById('nextLabel').textContent = view === 'week' ? 'Next Week' : 'Next Month';

    renderCurrentView();
    updatePeriodDisplay();
}

// Data Persistence
function loadData() {
    const storedTrainees = localStorage.getItem(STORAGE_KEYS.TRAINEES);
    const storedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    const storedBookings = localStorage.getItem(STORAGE_KEYS.DAY_BOOKINGS);

    if (storedTrainees) {
        state.trainees = JSON.parse(storedTrainees);
    }

    if (storedSessions) {
        state.sessions = JSON.parse(storedSessions);
    }

    if (storedBookings) {
        state.dayBookings = JSON.parse(storedBookings);
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEYS.TRAINEES, JSON.stringify(state.trainees));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(state.sessions));
    localStorage.setItem(STORAGE_KEYS.DAY_BOOKINGS, JSON.stringify(state.dayBookings));
}

// Date Utilities
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatWeekRange(weekStart) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Monday to Sunday
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}, ${weekStart.getFullYear()}`;
}

function getWeekKey(date) {
    // Use local date to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Rendering Functions
function renderTimetable() {
    const tbody = document.getElementById('timetableBody');
    tbody.innerHTML = '';

    // Update header with dates
    updateTableHeader();

    TIME_SLOTS.forEach((time, timeIndex) => {
        const row = document.createElement('tr');

        // Time cell
        const timeCell = document.createElement('td');
        timeCell.className = 'time-cell';
        timeCell.textContent = formatTimeDisplay(time);
        row.appendChild(timeCell);

        // Day cells
        DAYS.forEach((day, dayIndex) => {
            const cell = document.createElement('td');
            cell.dataset.day = dayIndex;
            cell.dataset.time = time;

            const isWeekend = WEEKEND_DAYS.includes(dayIndex);

            // Calculate actual date for this day
            const cellDate = new Date(state.currentWeekStart);
            cellDate.setDate(cellDate.getDate() + dayIndex);
            const holiday = getHoliday(cellDate);

            // Add weekend class for styling
            if (isWeekend) {
                cell.classList.add('weekend-cell');
            }

            // Add holiday class and annotation
            if (holiday) {
                cell.classList.add('holiday-cell');
                // Only show holiday info in first time slot
                if (timeIndex === 0) {
                    const holidayLabel = document.createElement('div');
                    holidayLabel.className = 'holiday-label';
                    holidayLabel.innerHTML = `
                        <span class="holiday-short">${holiday.short}</span>
                        <div class="holiday-name">${holiday.name}</div>
                        <div class="holiday-desc">${holiday.description}</div>
                    `;
                    holidayLabel.title = holiday.description;
                    cell.appendChild(holidayLabel);
                }
            }

            // Get sessions for this cell (only for weekdays and non-holidays)
            if (!isWeekend && !holiday) {
                const cellSessions = getSessionsForCell(dayIndex, time);
                cellSessions.forEach(session => {
                    const sessionEl = createSessionElement(session);
                    cell.appendChild(sessionEl);
                });

                // Only add click event for weekdays (editable)
                cell.addEventListener('click', (e) => {
                    if (e.target === cell) {
                        openSessionModal(dayIndex, time);
                    }
                });
            }

            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
}

// Update table header with dates
function updateTableHeader() {
    const headerRow = document.querySelector('.timetable thead tr');
    const headers = headerRow.querySelectorAll('th:not(.time-column)');

    headers.forEach((th, index) => {
        const cellDate = new Date(state.currentWeekStart);
        cellDate.setDate(cellDate.getDate() + index);
        const dayNum = cellDate.getDate();
        const holiday = getHoliday(cellDate);

        // Clear existing content but keep classes
        const dayName = DAYS[index];
        const isWeekend = WEEKEND_DAYS.includes(index);

        if (holiday) {
            th.innerHTML = `${dayName}<br><span class="header-date holiday-date">${dayNum}</span>`;
            th.classList.add('holiday-header');
        } else if (isWeekend) {
            th.innerHTML = `${dayName}<br><span class="header-date">${dayNum}</span>`;
        } else {
            th.innerHTML = `${dayName}<br><span class="header-date">${dayNum}</span>`;
            th.classList.remove('holiday-header');
        }
    });
}

// Monthly View Rendering
function renderMonthView() {
    const container = document.getElementById('monthGrid');
    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth();

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

    // Build calendar HTML
    let html = '<div class="month-header-row">';
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    dayNames.forEach((day, index) => {
        const isWeekend = index >= 5;
        html += `<div class="month-header-cell ${isWeekend ? 'weekend' : ''}">${day}</div>`;
    });
    html += '</div>';

    html += '<div class="month-days-grid">';

    // Empty cells before first day
    for (let i = 0; i < startDayOfWeek; i++) {
        html += '<div class="month-day-cell empty"></div>';
    }

    // Days of month
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day, 12, 0, 0); // Use noon to avoid timezone edge cases
        const dayOfWeek = (date.getDay() + 6) % 7;
        const isWeekend = dayOfWeek >= 5;
        const holiday = getHoliday(date);
        const isPast = isPastDate(date);

        let cellClass = 'month-day-cell';
        if (isWeekend) cellClass += ' weekend';
        if (holiday) cellClass += ' holiday';
        if (isPast) cellClass += ' past-day';

        html += `<div class="${cellClass}">`;
        html += `<div class="month-day-number ${holiday ? 'holiday-date' : ''}">${day}</div>`;

        if (holiday) {
            html += `<div class="month-holiday-info">`;
            html += `<span class="month-holiday-badge">${holiday.short}</span>`;
            html += `<div class="month-holiday-name">${holiday.name}</div>`;
            html += `<div class="month-holiday-desc">${holiday.description}</div>`;
            html += `</div>`;
        }

        // Show bookings for this day (weekdays only, non-holidays)
        if (!isWeekend && !holiday) {
            const dateKey = getDateKey(date);
            const dayBookings = getBookingsForDay(date);

            if (dayBookings.length > 0) {
                html += `<div class="month-bookings">`;
                dayBookings.forEach(booking => {
                    const trainee = state.trainees.find(t => t.id === booking.traineeId);
                    const statusClass = booking.status === 'present' ? 'status-present' : 'status-planned';
                    // Past days: show bookings but no click handler
                    if (isPast) {
                        html += `<div class="month-booking-item ${statusClass}">`;
                    } else {
                        html += `<div class="month-booking-item ${statusClass}" onclick="openBookingModal('${dateKey}', '${booking.id}')">`;
                    }
                    html += `<span class="booking-trainee">${trainee ? escapeHtml(trainee.name) : 'Unknown'}</span>`;
                    html += `<span class="booking-hours">${booking.hours}h</span>`;
                    html += `<span class="booking-status">${booking.status}</span>`;
                    html += `</div>`;
                });
                html += `</div>`;
            }

            // Add booking button only for future/current dates
            if (!isPast) {
                html += `<div class="add-booking-btn" onclick="openBookingModal('${dateKey}')">+ Add</div>`;
            }
        }

        html += '</div>';
    }

    // Empty cells after last day
    const endDayOfWeek = (lastDay.getDay() + 6) % 7;
    for (let i = endDayOfWeek + 1; i < 7; i++) {
        html += '<div class="month-day-cell empty"></div>';
    }

    html += '</div>';

    container.innerHTML = html;
}

// Get sessions for a specific date
function getSessionsForDay(date) {
    const weekStart = getWeekStart(date);
    const weekKey = getWeekKey(weekStart);
    const dayOfWeek = (date.getDay() + 6) % 7; // Monday = 0

    return state.sessions.filter(s =>
        s.week === weekKey &&
        s.day === dayOfWeek
    );
}

// Check if a date is in the past (before today)
function isPastDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
}

// Day Booking Functions
function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getBookingsForDay(date) {
    const dateKey = getDateKey(date);
    return state.dayBookings.filter(b => b.date === dateKey);
}

function getWeeklyHoursForTrainee(traineeId, weekStartDate) {
    const weekStart = getWeekStart(weekStartDate);
    let totalHours = 0;

    // Check all 7 days of the week
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + i);
        const dateKey = getDateKey(dayDate);

        const dayBookings = state.dayBookings.filter(b =>
            b.date === dateKey && b.traineeId === traineeId
        );

        dayBookings.forEach(b => {
            totalHours += b.hours || 0;
        });
    }

    return totalHours;
}

function canAddHours(traineeId, date, newHours, excludeBookingId = null) {
    const weekStart = getWeekStart(date);
    let currentWeeklyHours = getWeeklyHoursForTrainee(traineeId, weekStart);

    // If editing, subtract the old hours
    if (excludeBookingId) {
        const existingBooking = state.dayBookings.find(b => b.id === excludeBookingId);
        if (existingBooking) {
            currentWeeklyHours -= existingBooking.hours || 0;
        }
    }

    return (currentWeeklyHours + newHours) <= MAX_WEEKLY_HOURS;
}

function formatTimeDisplay(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
}

function getSessionsForCell(dayIndex, time) {
    const weekKey = getWeekKey(state.currentWeekStart);
    return state.sessions.filter(s =>
        s.week === weekKey &&
        s.day === dayIndex &&
        s.time === time
    );
}

function createSessionElement(session) {
    const trainee = state.trainees.find(t => t.id === session.traineeId);
    const div = document.createElement('div');
    div.className = `session-item session-type-${session.type}`;
    if (trainee) {
        div.style.background = `linear-gradient(135deg, ${trainee.color} 0%, ${adjustColor(trainee.color, -20)} 100%)`;
    }
    div.innerHTML = `
        <div class="session-title">${escapeHtml(session.title)}</div>
        <div class="session-trainee">${trainee ? escapeHtml(trainee.name) : 'Unknown'}</div>
    `;
    div.addEventListener('click', (e) => {
        e.stopPropagation();
        openSessionModal(session.day, session.time, session);
    });
    return div;
}

function renderTraineeList() {
    const container = document.getElementById('traineeList');

    if (state.trainees.length === 0) {
        container.innerHTML = '<div class="empty-state">No trainees yet. Click "Add Trainee" to get started.</div>';
        return;
    }

    container.innerHTML = state.trainees.map(trainee => `
        <div class="trainee-item" data-id="${trainee.id}">
            <div class="trainee-color" style="background-color: ${trainee.color}"></div>
            <div class="trainee-info">
                <div class="trainee-name">${escapeHtml(trainee.name)}</div>
                ${trainee.email ? `<div class="trainee-email">${escapeHtml(trainee.email)}</div>` : ''}
            </div>
            <div class="trainee-actions">
                <button onclick="editTrainee('${trainee.id}')" title="Edit">&#9998;</button>
                <button onclick="deleteTrainee('${trainee.id}')" title="Delete">&#10005;</button>
            </div>
        </div>
    `).join('');
}

function updatePeriodDisplay() {
    const display = document.getElementById('currentPeriod');
    if (state.currentView === 'week') {
        display.textContent = formatWeekRange(state.currentWeekStart);
    } else {
        display.textContent = formatMonthYear(state.currentMonth);
    }
}

function formatMonthYear(date) {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function updateTraineeSelect() {
    const select = document.getElementById('sessionTrainee');
    select.innerHTML = '<option value="">Select a trainee</option>' +
        state.trainees.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
}

// Event Bindings
function bindEvents() {
    // Header buttons
    document.getElementById('addTraineeBtn').addEventListener('click', () => openTraineeModal());
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', importData);

    // View toggle buttons
    document.getElementById('weekViewBtn').addEventListener('click', () => switchView('week'));
    document.getElementById('monthViewBtn').addEventListener('click', () => switchView('month'));

    // Navigation (works for both week and month)
    document.getElementById('prevBtn').addEventListener('click', () => navigate(-1));
    document.getElementById('nextBtn').addEventListener('click', () => navigate(1));

    // Modal close buttons
    document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.dataset.modal;
            if (modalId) {
                closeModal(modalId);
            }
        });
    });

    // Forms
    document.getElementById('traineeForm').addEventListener('submit', handleTraineeSubmit);
    document.getElementById('sessionForm').addEventListener('submit', handleSessionSubmit);
    document.getElementById('deleteSessionBtn').addEventListener('click', deleteSession);

    // Booking form
    document.getElementById('bookingForm').addEventListener('submit', handleBookingSubmit);
    document.getElementById('deleteBookingBtn').addEventListener('click', deleteBooking);
    document.getElementById('bookingTrainee').addEventListener('change', updateWeeklyHoursInfo);

    // Close modal on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Navigation (week or month)
function navigate(direction) {
    if (state.currentView === 'week') {
        const newDate = new Date(state.currentWeekStart);
        newDate.setDate(newDate.getDate() + (direction * 7));
        state.currentWeekStart = newDate;
    } else {
        const newDate = new Date(state.currentMonth);
        newDate.setMonth(newDate.getMonth() + direction);
        state.currentMonth = newDate;
    }
    updatePeriodDisplay();
    renderCurrentView();
}

// Trainee Management
function openTraineeModal(trainee = null) {
    state.editingTraineeId = trainee ? trainee.id : null;

    document.getElementById('traineeModalTitle').textContent = trainee ? 'Edit Trainee' : 'Add Trainee';
    document.getElementById('traineeName').value = trainee ? trainee.name : '';
    document.getElementById('traineeEmail').value = trainee ? trainee.email || '' : '';
    document.getElementById('traineeColor').value = trainee ? trainee.color : getRandomColor();
    document.getElementById('traineeId').value = trainee ? trainee.id : '';

    showModal('traineeModal');
}

function handleTraineeSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('traineeName').value.trim();
    const email = document.getElementById('traineeEmail').value.trim();
    const color = document.getElementById('traineeColor').value;

    if (!name) return;

    if (state.editingTraineeId) {
        // Update existing trainee
        const trainee = state.trainees.find(t => t.id === state.editingTraineeId);
        if (trainee) {
            trainee.name = name;
            trainee.email = email;
            trainee.color = color;
        }
    } else {
        // Create new trainee
        const newTrainee = {
            id: generateId(),
            name,
            email,
            color
        };
        state.trainees.push(newTrainee);
    }

    saveData();
    renderTraineeList();
    renderTimetable();
    closeModal('traineeModal');
}

function editTrainee(id) {
    const trainee = state.trainees.find(t => t.id === id);
    if (trainee) {
        openTraineeModal(trainee);
    }
}

function deleteTrainee(id) {
    if (!confirm('Are you sure you want to delete this trainee? All their sessions will also be deleted.')) {
        return;
    }

    state.trainees = state.trainees.filter(t => t.id !== id);
    state.sessions = state.sessions.filter(s => s.traineeId !== id);

    saveData();
    renderTraineeList();
    renderTimetable();
}

// Session Management
function openSessionModal(dayIndex, time, session = null) {
    state.editingSessionId = session ? session.id : null;

    updateTraineeSelect();

    document.getElementById('sessionModalTitle').textContent = session ? 'Edit Session' : 'Add Session';
    document.getElementById('sessionTrainee').value = session ? session.traineeId : '';
    document.getElementById('sessionTitle').value = session ? session.title : '';
    document.getElementById('sessionType').value = session ? session.type : 'training';
    document.getElementById('sessionNotes').value = session ? session.notes || '' : '';
    document.getElementById('sessionDay').value = dayIndex;
    document.getElementById('sessionTime').value = time;
    document.getElementById('sessionWeek').value = getWeekKey(state.currentWeekStart);
    document.getElementById('sessionId').value = session ? session.id : '';

    const deleteBtn = document.getElementById('deleteSessionBtn');
    if (session) {
        deleteBtn.classList.remove('hidden');
    } else {
        deleteBtn.classList.add('hidden');
    }

    showModal('sessionModal');
}

function handleSessionSubmit(e) {
    e.preventDefault();

    const traineeId = document.getElementById('sessionTrainee').value;
    const title = document.getElementById('sessionTitle').value.trim();
    const type = document.getElementById('sessionType').value;
    const notes = document.getElementById('sessionNotes').value.trim();
    const day = parseInt(document.getElementById('sessionDay').value);
    const time = document.getElementById('sessionTime').value;
    const week = document.getElementById('sessionWeek').value;

    if (!traineeId || !title) return;

    if (state.editingSessionId) {
        // Update existing session
        const session = state.sessions.find(s => s.id === state.editingSessionId);
        if (session) {
            session.traineeId = traineeId;
            session.title = title;
            session.type = type;
            session.notes = notes;
        }
    } else {
        // Create new session
        const newSession = {
            id: generateId(),
            traineeId,
            title,
            type,
            notes,
            day,
            time,
            week
        };
        state.sessions.push(newSession);
    }

    saveData();
    renderTimetable();
    closeModal('sessionModal');
}

function deleteSession() {
    if (!state.editingSessionId) return;

    if (!confirm('Are you sure you want to delete this session?')) {
        return;
    }

    state.sessions = state.sessions.filter(s => s.id !== state.editingSessionId);

    saveData();
    renderTimetable();
    closeModal('sessionModal');
}

// Import/Export
function exportData() {
    const data = {
        trainees: state.trainees,
        sessions: state.sessions,
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `trainee-timetable-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);

            if (data.trainees && Array.isArray(data.trainees)) {
                state.trainees = data.trainees;
            }

            if (data.sessions && Array.isArray(data.sessions)) {
                state.sessions = data.sessions;
            }

            saveData();
            renderTraineeList();
            renderTimetable();

            alert('Data imported successfully!');
        } catch (err) {
            alert('Error importing data. Please make sure the file is valid JSON.');
        }
    };
    reader.readAsText(file);

    // Reset input
    e.target.value = '';
}

// Modal Utilities
function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Helper Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getRandomColor() {
    const colors = ['#4a90d9', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function adjustColor(color, amount) {
    const clamp = (num) => Math.min(255, Math.max(0, num));

    let hex = color.replace('#', '');
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);

    r = clamp(r + amount);
    g = clamp(g + amount);
    b = clamp(b + amount);

    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Day Booking Management
function openBookingModal(dateKey, bookingId = null) {
    state.editingBookingId = bookingId;

    // Populate trainee select
    const select = document.getElementById('bookingTrainee');
    select.innerHTML = '<option value="">Select a trainee</option>' +
        state.trainees.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');

    const existingBooking = bookingId ? state.dayBookings.find(b => b.id === bookingId) : null;

    document.getElementById('bookingModalTitle').textContent = existingBooking ? 'Edit Training Day' : 'Add Training Day';
    document.getElementById('bookingTrainee').value = existingBooking ? existingBooking.traineeId : '';
    document.getElementById('bookingHours').value = existingBooking ? existingBooking.hours : 8;
    document.getElementById('bookingStatus').value = existingBooking ? existingBooking.status : 'planned';
    document.getElementById('bookingDate').value = dateKey;
    document.getElementById('bookingId').value = bookingId || '';

    const deleteBtn = document.getElementById('deleteBookingBtn');
    if (existingBooking) {
        deleteBtn.classList.remove('hidden');
    } else {
        deleteBtn.classList.add('hidden');
    }

    updateWeeklyHoursInfo();
    showModal('bookingModal');
}

function updateWeeklyHoursInfo() {
    const traineeId = document.getElementById('bookingTrainee').value;
    const dateKey = document.getElementById('bookingDate').value;
    const infoDiv = document.getElementById('weeklyHoursInfo');

    if (!traineeId || !dateKey) {
        infoDiv.textContent = '';
        return;
    }

    // Parse date from dateKey
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const weeklyHours = getWeeklyHoursForTrainee(traineeId, date);
    const remaining = MAX_WEEKLY_HOURS - weeklyHours;

    // If editing, add back the current booking's hours
    const bookingId = document.getElementById('bookingId').value;
    if (bookingId) {
        const existingBooking = state.dayBookings.find(b => b.id === bookingId);
        if (existingBooking && existingBooking.traineeId === traineeId) {
            infoDiv.textContent = `Weekly: ${weeklyHours}h used, ${remaining + existingBooking.hours}h available (including current)`;
            return;
        }
    }

    infoDiv.textContent = `Weekly: ${weeklyHours}h used, ${remaining}h available (max ${MAX_WEEKLY_HOURS}h/week)`;
    infoDiv.style.color = remaining <= 0 ? '#e74c3c' : '#666';
}

function handleBookingSubmit(e) {
    e.preventDefault();

    const traineeId = document.getElementById('bookingTrainee').value;
    const hours = parseInt(document.getElementById('bookingHours').value);
    const status = document.getElementById('bookingStatus').value;
    const dateKey = document.getElementById('bookingDate').value;
    const bookingId = document.getElementById('bookingId').value;

    if (!traineeId || !hours || !dateKey) return;

    // Parse date for weekly hours check
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    // Check weekly hours limit
    if (!canAddHours(traineeId, date, hours, bookingId || null)) {
        alert(`Cannot add ${hours} hours. Would exceed weekly limit of ${MAX_WEEKLY_HOURS} hours for this trainee.`);
        return;
    }

    if (bookingId) {
        // Update existing booking
        const booking = state.dayBookings.find(b => b.id === bookingId);
        if (booking) {
            booking.traineeId = traineeId;
            booking.hours = hours;
            booking.status = status;
        }
    } else {
        // Create new booking
        const newBooking = {
            id: generateId(),
            date: dateKey,
            traineeId,
            hours,
            status
        };
        state.dayBookings.push(newBooking);
    }

    saveData();
    renderCurrentView();
    closeModal('bookingModal');
}

function deleteBooking() {
    const bookingId = document.getElementById('bookingId').value;
    if (!bookingId) return;

    if (!confirm('Are you sure you want to delete this training day?')) {
        return;
    }

    state.dayBookings = state.dayBookings.filter(b => b.id !== bookingId);

    saveData();
    renderCurrentView();
    closeModal('bookingModal');
}

// Make functions available globally for inline event handlers
window.editTrainee = editTrainee;
window.deleteTrainee = deleteTrainee;
window.switchView = switchView;
window.openBookingModal = openBookingModal;
