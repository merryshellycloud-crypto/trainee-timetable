/**
 * Trainee Timetable Application
 * A simple web application for managing trainee schedules
 * Optimized for performance
 */

// Cached DOM elements - populated once at init
const DOM = {};

// Application State
const state = {
    trainees: [],
    sessions: [],
    dayBookings: [],
    currentWeekStart: null,
    currentMonth: new Date(),
    currentView: 'week',
    editingTraineeId: null,
    editingSessionId: null,
    editingBookingId: null,
    // Cached lookups for performance
    traineeMap: new Map(),
    bookingsByDate: new Map(),
    sessionsByWeekDayTime: new Map()
};

// Initialize currentWeekStart after function is defined
state.currentWeekStart = getWeekStart(new Date());

// Time slots for the timetable (8 AM to 6 PM)
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKEND_DAYS = new Set([5, 6]);

// Pre-formatted time display cache
const TIME_DISPLAY_CACHE = {};
TIME_SLOTS.forEach(time => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    TIME_DISPLAY_CACHE[time] = `${displayHour}:${minutes} ${period}`;
});

// Bulgarian Public Holidays 2026
// Note: When a holiday falls on Saturday/Sunday, the following Monday is a compensation day (Bulgarian law)
const HOLIDAYS_2026 = {
    '2026-01-01': { name: 'New Year\'s Day', short: 'NY', description: 'Celebrates the beginning of the new calendar year. Bulgarians welcome the new year with festive gatherings, fireworks, and traditional meals.' },
    '2026-03-03': { name: 'Liberation Day', short: 'LD', description: 'Bulgaria\'s National Day commemorating liberation from Ottoman rule in 1878. The Treaty of San Stefano ended nearly 500 years of Ottoman domination.' },
    '2026-04-17': { name: 'Good Friday', short: 'GF', description: 'Orthodox Christian holy day marking the crucifixion of Jesus Christ. A solemn day of fasting and reflection before Easter.' },
    '2026-04-18': { name: 'Holy Saturday', short: 'HS', description: 'The day between Good Friday and Easter Sunday. Bulgarians prepare Easter eggs and traditional kozunak bread.' },
    '2026-04-19': { name: 'Easter Sunday', short: 'ES', description: 'The most important Orthodox Christian holiday celebrating Christ\'s resurrection. Families gather for festive meals and egg-cracking traditions.' },
    '2026-04-20': { name: 'Easter Monday', short: 'EM', description: 'Continuation of Easter celebrations. A day for family visits, sharing Easter meals, and enjoying the spring weather.' },
    '2026-05-01': { name: 'Labour Day', short: 'LabD', description: 'International Workers\' Day celebrating the achievements of workers worldwide. Many Bulgarians enjoy outdoor activities and picnics.' },
    '2026-05-06': { name: 'St. George\'s Day', short: 'SGD', description: 'Also known as Bulgarian Army Day. Honors St. George, patron saint of the military. Traditional lamb dishes are prepared on this day.' },
    '2026-05-24': { name: 'Education & Culture Day', short: 'ED', description: 'Celebrates Saints Cyril and Methodius who created the Cyrillic alphabet. A day honoring Bulgarian education, culture, and Slavic heritage.' },
    '2026-05-25': { name: 'Education Day (Observed)', short: 'ED+', description: 'Compensation day for Education & Culture Day which falls on Sunday. Per Bulgarian law, the following Monday is a non-working day.' },
    '2026-09-06': { name: 'Unification Day', short: 'UD', description: 'Commemorates the unification of Eastern Rumelia with the Principality of Bulgaria in 1885. A milestone in Bulgarian national unity.' },
    '2026-09-07': { name: 'Unification Day (Observed)', short: 'UD+', description: 'Compensation day for Unification Day which falls on Sunday. Per Bulgarian law, the following Monday is a non-working day.' },
    '2026-09-22': { name: 'Independence Day', short: 'ID', description: 'Marks Bulgaria\'s declaration of full independence from the Ottoman Empire in 1908. Celebrated with official ceremonies and cultural events.' },
    '2026-12-24': { name: 'Christmas Eve', short: 'CE', description: 'Badni Vecher - a sacred family evening with traditional meatless dinner of odd-numbered dishes. Families gather to share blessings.' },
    '2026-12-25': { name: 'Christmas Day', short: 'XM', description: 'Celebrates the birth of Jesus Christ. Bulgarian Christmas traditions include caroling, festive meals, and family gatherings.' },
    '2026-12-26': { name: 'Christmas Day 2', short: 'XM2', description: 'Second day of Christmas celebrations. Continued family visits, festive meals, and holiday traditions across Bulgaria.' },
    '2026-12-28': { name: 'Christmas (Observed)', short: 'XM+', description: 'Compensation day for Christmas Day 2 which falls on Saturday. Per Bulgarian law, the following Monday is a non-working day.' }
};

// Storage Keys
const STORAGE_KEYS = {
    TRAINEES: 'trainee_timetable_trainees',
    SESSIONS: 'trainee_timetable_sessions',
    DAY_BOOKINGS: 'trainee_timetable_day_bookings'
};

const MAX_WEEKLY_HOURS = 20;

// HTML escape - optimized without DOM creation
const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, c => escapeMap[c]);
}

// Cache DOM elements for faster access
function cacheDOMElements() {
    const ids = [
        'weekView', 'monthView', 'monthGrid', 'timetableBody', 'currentPeriod',
        'weekViewBtn', 'monthViewBtn', 'prevLabel', 'nextLabel',
        'traineeList', 'currentDateLabel', 'currentTimeLabel',
        'traineeModal', 'sessionModal', 'bookingModal',
        'traineeModalTitle', 'traineeName', 'traineeEmail', 'traineeColor', 'traineeId',
        'sessionModalTitle', 'sessionTrainee', 'sessionTitle', 'sessionType',
        'sessionNotes', 'sessionDay', 'sessionTime', 'sessionWeek', 'sessionId', 'deleteSessionBtn',
        'bookingModalTitle', 'bookingTrainee', 'bookingHours', 'bookingStatus',
        'bookingDate', 'bookingId', 'deleteBookingBtn', 'weeklyHoursInfo',
        'addTraineeBtn', 'exportBtn', 'importBtn', 'importFile', 'prevBtn', 'nextBtn',
        'traineeForm', 'sessionForm', 'bookingForm'
    ];
    ids.forEach(id => { DOM[id] = document.getElementById(id); });
    DOM.timetableHeaders = document.querySelectorAll('.timetable thead tr th:not(.time-column)');
    DOM.modals = document.querySelectorAll('.modal');
    DOM.modalCloseButtons = document.querySelectorAll('.modal-close, [data-modal]');
}

// Initialize Application
document.addEventListener('DOMContentLoaded', init);

function init() {
    cacheDOMElements();
    loadData();
    autoUpdatePastBookings(); // Auto-set past planned bookings to present
    buildLookupMaps();
    renderCurrentView();
    renderTraineeList();
    updatePeriodDisplay();
    updateCurrentDateTime();
    bindEvents();
    setInterval(updateCurrentDateTime, 60000);
}

// Auto-update past bookings from 'planned' to 'present'
function autoUpdatePastBookings() {
    const today = getTodayInfo();
    let updated = false;

    state.dayBookings.forEach(booking => {
        if (booking.status === 'planned' && booking.date < today.key) {
            booking.status = 'present';
            updated = true;
        }
    });

    if (updated) {
        saveData();
    }
}

// Build lookup maps for O(1) access
function buildLookupMaps() {
    // Trainee map
    state.traineeMap.clear();
    state.trainees.forEach(t => state.traineeMap.set(t.id, t));

    // Bookings by date
    state.bookingsByDate.clear();
    state.dayBookings.forEach(b => {
        if (!state.bookingsByDate.has(b.date)) {
            state.bookingsByDate.set(b.date, []);
        }
        state.bookingsByDate.get(b.date).push(b);
    });

    // Sessions by week-day-time
    state.sessionsByWeekDayTime.clear();
    state.sessions.forEach(s => {
        const key = `${s.week}-${s.day}-${s.time}`;
        if (!state.sessionsByWeekDayTime.has(key)) {
            state.sessionsByWeekDayTime.set(key, []);
        }
        state.sessionsByWeekDayTime.get(key).push(s);
    });
}

// Render based on current view
function renderCurrentView() {
    const isWeek = state.currentView === 'week';
    DOM.weekView.classList.toggle('hidden', !isWeek);
    DOM.monthView.classList.toggle('hidden', isWeek);
    isWeek ? renderTimetable() : renderMonthView();
}

// Switch view mode
function switchView(view) {
    state.currentView = view;
    DOM.weekViewBtn.classList.toggle('active', view === 'week');
    DOM.monthViewBtn.classList.toggle('active', view === 'month');
    DOM.prevLabel.textContent = view === 'week' ? 'Previous Week' : 'Previous Month';
    DOM.nextLabel.textContent = view === 'week' ? 'Next Week' : 'Next Month';
    renderCurrentView();
    updatePeriodDisplay();
}

// Data Persistence
function loadData() {
    try {
        const storedTrainees = localStorage.getItem(STORAGE_KEYS.TRAINEES);
        const storedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
        const storedBookings = localStorage.getItem(STORAGE_KEYS.DAY_BOOKINGS);
        if (storedTrainees) state.trainees = JSON.parse(storedTrainees);
        if (storedSessions) state.sessions = JSON.parse(storedSessions);
        if (storedBookings) state.dayBookings = JSON.parse(storedBookings);
    } catch (e) {
        console.error('Error loading data:', e);
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEYS.TRAINEES, JSON.stringify(state.trainees));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(state.sessions));
    localStorage.setItem(STORAGE_KEYS.DAY_BOOKINGS, JSON.stringify(state.dayBookings));
    buildLookupMaps();
}

// Date Utilities - optimized
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatWeekRange(weekStart) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}, ${weekStart.getFullYear()}`;
}

function getDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getHoliday(dateKey) {
    return HOLIDAYS_2026[dateKey] || null;
}

// Get today's info - cached per render cycle
let todayCache = null;
function getTodayInfo() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    return { year: y, month: m, day: d, key: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` };
}

function isPastDate(dateKey, today) {
    return dateKey < today.key;
}

function isToday(dateKey, today) {
    return dateKey === today.key;
}

// Rendering Functions - optimized with string building
function renderTimetable() {
    const today = getTodayInfo();
    const weekKey = getDateKey(state.currentWeekStart);
    const fragment = document.createDocumentFragment();

    // Pre-calculate day info for the week
    const dayInfo = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(state.currentWeekStart);
        d.setDate(d.getDate() + i);
        const dateKey = getDateKey(d);
        dayInfo.push({
            date: d,
            dateKey,
            dayNum: d.getDate(),
            isWeekend: WEEKEND_DAYS.has(i),
            holiday: getHoliday(dateKey),
            isToday: isToday(dateKey, today)
        });
    }

    // Update headers
    DOM.timetableHeaders.forEach((th, index) => {
        const info = dayInfo[index];
        th.classList.remove('today-header', 'holiday-header');

        let headerClass = '';
        if (info.holiday) headerClass = 'holiday-date';

        let headerContent = `${DAYS[index]}<br><span class="header-date ${headerClass}">${info.dayNum}`;
        if (info.holiday) {
            headerContent += ` <span class="header-holiday-name">${info.holiday.name}</span>`;
        }
        headerContent += `</span>`;
        th.innerHTML = headerContent;

        if (info.holiday) th.classList.add('holiday-header');
        if (info.isToday) th.classList.add('today-header');
    });

    // Build rows
    TIME_SLOTS.forEach((time, timeIndex) => {
        const row = document.createElement('tr');

        // Time cell
        const timeCell = document.createElement('td');
        timeCell.className = 'time-cell';
        timeCell.textContent = TIME_DISPLAY_CACHE[time];
        row.appendChild(timeCell);

        // Day cells
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const info = dayInfo[dayIndex];
            const cell = document.createElement('td');

            if (info.isWeekend) cell.className = 'weekend-cell';
            if (info.isToday) cell.classList.add('today-cell');

            if (info.holiday) {
                cell.classList.add('holiday-cell');
                if (timeIndex === 0) {
                    cell.innerHTML = `<div class="holiday-label">
                        <div class="holiday-desc">${info.holiday.description}</div>
                    </div>`;
                }
            } else if (!info.isWeekend) {
                // Get sessions using map lookup
                const sessionKey = `${weekKey}-${dayIndex}-${time}`;
                const cellSessions = state.sessionsByWeekDayTime.get(sessionKey) || [];

                cellSessions.forEach(session => {
                    const trainee = state.traineeMap.get(session.traineeId);
                    const div = document.createElement('div');
                    div.className = `session-item session-type-${session.type}`;
                    if (trainee) {
                        div.style.background = `linear-gradient(135deg, ${trainee.color} 0%, ${adjustColor(trainee.color, -20)} 100%)`;
                    }
                    div.innerHTML = `<div class="session-title">${escapeHtml(session.title)}</div>
                        <div class="session-trainee">${trainee ? escapeHtml(trainee.name) : 'Unknown'}</div>`;
                    div.onclick = (e) => { e.stopPropagation(); openSessionModal(dayIndex, time, session); };
                    cell.appendChild(div);
                });

                cell.onclick = (e) => { if (e.target === cell) openSessionModal(dayIndex, time); };
            }

            row.appendChild(cell);
        }

        fragment.appendChild(row);
    });

    DOM.timetableBody.innerHTML = '';
    DOM.timetableBody.appendChild(fragment);
}

// Monthly View Rendering - optimized with single innerHTML assignment
function renderMonthView() {
    const today = getTodayInfo();
    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;

    // Build HTML string
    const parts = ['<div class="month-header-row">'];

    // Week number header
    parts.push('<div class="month-header-cell week-header">Wk</div>');

    DAY_NAMES_SHORT.forEach((day, i) => {
        parts.push(`<div class="month-header-cell${i >= 5 ? ' weekend' : ''}">${day}</div>`);
    });
    parts.push('</div><div class="month-days-grid">');

    // Build calendar row by row
    let currentDay = 1;
    let currentDayOfWeek = startDayOfWeek;

    // Calculate number of rows needed
    const totalCells = startDayOfWeek + totalDays;
    const numRows = Math.ceil(totalCells / 7);

    for (let row = 0; row < numRows; row++) {
        // Check if this row has any days in the weekday columns (Mon-Fri, cols 0-4)
        let hasWeekdays = false;
        const rowStartDay = row === 0 ? 1 : (row * 7 - startDayOfWeek + 1);

        for (let col = 0; col < 5; col++) { // Only check Mon-Fri (cols 0-4)
            const dayForCol = row === 0 ? (col >= startDayOfWeek ? col - startDayOfWeek + 1 : 0) : (rowStartDay + col);
            if (dayForCol >= 1 && dayForCol <= totalDays) {
                hasWeekdays = true;
                break;
            }
        }

        // Skip this row if no weekdays have actual dates
        if (!hasWeekdays) {
            // Still need to advance currentDay for any weekend days in this row
            for (let col = 0; col < 7; col++) {
                if (row === 0 && col < startDayOfWeek) continue;
                if (currentDay <= totalDays) currentDay++;
            }
            continue;
        }

        // Calculate week number for first day of this row
        let weekNum;
        if (row === 0 && startDayOfWeek > 0) {
            // First row starts with empty cells, use week of day 1
            weekNum = getWeekNumber(new Date(year, month, 1));
        } else {
            const dayInRow = currentDay <= totalDays ? currentDay : totalDays;
            weekNum = getWeekNumber(new Date(year, month, dayInRow));
        }

        // Add week number cell
        parts.push(`<div class="month-week-cell">W${weekNum}</div>`);

        // Add 7 day cells for this row
        for (let col = 0; col < 7; col++) {
            if (row === 0 && col < startDayOfWeek) {
                // Empty cells before first day
                parts.push('<div class="month-day-cell empty"></div>');
            } else if (currentDay > totalDays) {
                // Empty cells after last day
                parts.push('<div class="month-day-cell empty"></div>');
            } else {
                // Actual day cell
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
                const dayOfWeek = col;
                const isWeekend = dayOfWeek >= 5;
                const holiday = getHoliday(dateKey);
                const isPast = isPastDate(dateKey, today);
                const isTodayDate = isToday(dateKey, today);

                let cellClass = 'month-day-cell';
                if (isWeekend) cellClass += ' weekend';
                if (holiday) cellClass += ' holiday';
                if (isPast) cellClass += ' past-day';
                if (isTodayDate) cellClass += ' today';

                parts.push(`<div class="${cellClass}">`);
                parts.push(`<div class="month-day-header${holiday ? ' holiday-date' : ''}">${currentDay}${holiday ? ` <span class="month-holiday-title">${holiday.name}</span>` : ''}</div>`);

                if (holiday) {
                    parts.push(`<div class="month-holiday-desc">${holiday.description}</div>`);
                } else if (!isWeekend) {
                    // Get bookings using map lookup
                    const dayBookings = state.bookingsByDate.get(dateKey) || [];

                    if (dayBookings.length > 0) {
                        parts.push('<div class="month-bookings">');
                        dayBookings.forEach(booking => {
                            const trainee = state.traineeMap.get(booking.traineeId);
                            const statusClass = booking.status === 'present' ? 'status-present' : 'status-planned';
                            const clickAttr = isPast ? '' : ` onclick="openBookingModal('${dateKey}', '${booking.id}')"`;
                            parts.push(`<div class="month-booking-item ${statusClass}"${clickAttr}>
                                <span class="booking-trainee">${trainee ? escapeHtml(trainee.name) : 'Unknown'}</span>
                                <span class="booking-hours">${booking.hours}h</span>
                                <span class="booking-status">${booking.status}</span>
                            </div>`);
                        });
                        parts.push('</div>');
                    }

                    if (!isPast) {
                        parts.push(`<div class="add-booking-btn" onclick="openBookingModal('${dateKey}')">+ Add</div>`);
                    }
                }

                parts.push('</div>');
                currentDay++;
            }
        }
    }

    parts.push('</div>');
    DOM.monthGrid.innerHTML = parts.join('');
}

// Update current date and time display
function updateCurrentDateTime() {
    const now = new Date();
    DOM.currentDateLabel.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    DOM.currentTimeLabel.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// Booking Functions - optimized with map lookups
function getBookingsForDay(dateKey) {
    return state.bookingsByDate.get(dateKey) || [];
}

function getWeeklyHoursForTrainee(traineeId, date) {
    const weekStart = getWeekStart(date);
    let totalHours = 0;

    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const dateKey = getDateKey(d);
        const dayBookings = state.bookingsByDate.get(dateKey) || [];
        dayBookings.forEach(b => {
            if (b.traineeId === traineeId) totalHours += b.hours || 0;
        });
    }

    return totalHours;
}

function canAddHours(traineeId, date, newHours, excludeBookingId = null) {
    let currentWeeklyHours = getWeeklyHoursForTrainee(traineeId, date);

    if (excludeBookingId) {
        const existingBooking = state.dayBookings.find(b => b.id === excludeBookingId);
        if (existingBooking) currentWeeklyHours -= existingBooking.hours || 0;
    }

    return (currentWeeklyHours + newHours) <= MAX_WEEKLY_HOURS;
}

function renderTraineeList() {
    if (state.trainees.length === 0) {
        DOM.traineeList.innerHTML = '<div class="empty-state">No trainees yet. Click "Add Trainee" to get started.</div>';
        return;
    }

    // Get current week for hours calculation
    const currentWeekStart = state.currentView === 'week' ? state.currentWeekStart : getWeekStart(new Date());
    const weekNumber = getWeekNumber(currentWeekStart);

    DOM.traineeList.innerHTML = state.trainees.map(t => {
        const weeklyStats = getTraineeWeeklyStats(t.id, currentWeekStart);
        return `
        <div class="trainee-item" data-id="${t.id}">
            <div class="trainee-color" style="background-color: ${t.color}"></div>
            <div class="trainee-info">
                <div class="trainee-name">${escapeHtml(t.name)}</div>
                ${t.email ? `<div class="trainee-email">${escapeHtml(t.email)}</div>` : ''}
                <div class="trainee-week-label">W${weekNumber}</div>
                <div class="trainee-hours-bars">
                    <div class="hours-bar present-bar" title="Present hours">
                        <span class="bar-icon">&#10003;</span>
                        <span class="bar-value">${weeklyStats.present}h</span>
                    </div>
                    <div class="hours-bar planned-bar" title="Planned hours">
                        <span class="bar-icon">&#9679;</span>
                        <span class="bar-value">${weeklyStats.planned}h</span>
                    </div>
                    <div class="hours-total-badge">${weeklyStats.total}/${MAX_WEEKLY_HOURS}h</div>
                </div>
            </div>
            <div class="trainee-actions">
                <button onclick="editTrainee('${t.id}')" title="Edit">&#9998;</button>
                <button onclick="deleteTrainee('${t.id}')" title="Delete">&#10005;</button>
            </div>
        </div>
    `}).join('');
}

// Get ISO week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Get weekly stats for a trainee (planned and present hours)
function getTraineeWeeklyStats(traineeId, weekStartDate) {
    const weekStart = getWeekStart(weekStartDate);
    let planned = 0;
    let present = 0;

    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const dateKey = getDateKey(d);
        const dayBookings = state.bookingsByDate.get(dateKey) || [];

        dayBookings.forEach(b => {
            if (b.traineeId === traineeId) {
                if (b.status === 'present') {
                    present += b.hours || 0;
                } else {
                    planned += b.hours || 0;
                }
            }
        });
    }

    return { planned, present, total: planned + present };
}

function updatePeriodDisplay() {
    DOM.currentPeriod.textContent = state.currentView === 'week'
        ? formatWeekRange(state.currentWeekStart)
        : state.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function updateTraineeSelect(selectElement) {
    selectElement.innerHTML = '<option value="">Select a trainee</option>' +
        state.trainees.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
}

// Event Bindings
function bindEvents() {
    DOM.addTraineeBtn.onclick = () => openTraineeModal();
    DOM.exportBtn.onclick = exportData;
    DOM.importBtn.onclick = () => DOM.importFile.click();
    DOM.importFile.onchange = importData;

    DOM.weekViewBtn.onclick = () => switchView('week');
    DOM.monthViewBtn.onclick = () => switchView('month');

    DOM.prevBtn.onclick = () => navigate(-1);
    DOM.nextBtn.onclick = () => navigate(1);

    DOM.modalCloseButtons.forEach(btn => {
        btn.onclick = function() {
            const modalId = this.dataset.modal;
            if (modalId) closeModal(modalId);
        };
    });

    DOM.traineeForm.onsubmit = handleTraineeSubmit;
    DOM.sessionForm.onsubmit = handleSessionSubmit;
    DOM.deleteSessionBtn.onclick = deleteSession;

    DOM.bookingForm.onsubmit = handleBookingSubmit;
    DOM.deleteBookingBtn.onclick = deleteBooking;
    DOM.bookingTrainee.onchange = updateWeeklyHoursInfo;

    DOM.modals.forEach(modal => {
        modal.onclick = (e) => { if (e.target === modal) closeModal(modal.id); };
    });
}

// Navigation
function navigate(direction) {
    if (state.currentView === 'week') {
        state.currentWeekStart.setDate(state.currentWeekStart.getDate() + (direction * 7));
    } else {
        state.currentMonth.setMonth(state.currentMonth.getMonth() + direction);
    }
    updatePeriodDisplay();
    renderCurrentView();
    renderTraineeList(); // Update weekly hours for new period
}

// Trainee Management
function openTraineeModal(trainee = null) {
    state.editingTraineeId = trainee ? trainee.id : null;
    DOM.traineeModalTitle.textContent = trainee ? 'Edit Trainee' : 'Add Trainee';
    DOM.traineeName.value = trainee ? trainee.name : '';
    DOM.traineeEmail.value = trainee ? trainee.email || '' : '';
    DOM.traineeColor.value = trainee ? trainee.color : getRandomColor();
    DOM.traineeId.value = trainee ? trainee.id : '';
    showModal('traineeModal');
}

function handleTraineeSubmit(e) {
    e.preventDefault();
    const name = DOM.traineeName.value.trim();
    const email = DOM.traineeEmail.value.trim();
    const color = DOM.traineeColor.value;

    if (!name) return;

    if (state.editingTraineeId) {
        const trainee = state.traineeMap.get(state.editingTraineeId);
        if (trainee) {
            trainee.name = name;
            trainee.email = email;
            trainee.color = color;
        }
    } else {
        state.trainees.push({ id: generateId(), name, email, color });
    }

    saveData();
    renderTraineeList();
    renderCurrentView();
    closeModal('traineeModal');
}

function editTrainee(id) {
    const trainee = state.traineeMap.get(id);
    if (trainee) openTraineeModal(trainee);
}

function deleteTrainee(id) {
    if (!confirm('Are you sure you want to delete this trainee? All their sessions will also be deleted.')) return;

    state.trainees = state.trainees.filter(t => t.id !== id);
    state.sessions = state.sessions.filter(s => s.traineeId !== id);
    state.dayBookings = state.dayBookings.filter(b => b.traineeId !== id);

    saveData();
    renderTraineeList();
    renderCurrentView();
}

// Session Management
function openSessionModal(dayIndex, time, session = null) {
    state.editingSessionId = session ? session.id : null;
    updateTraineeSelect(DOM.sessionTrainee);

    DOM.sessionModalTitle.textContent = session ? 'Edit Session' : 'Add Session';
    DOM.sessionTrainee.value = session ? session.traineeId : '';
    DOM.sessionTitle.value = session ? session.title : '';
    DOM.sessionType.value = session ? session.type : 'training';
    DOM.sessionNotes.value = session ? session.notes || '' : '';
    DOM.sessionDay.value = dayIndex;
    DOM.sessionTime.value = time;
    DOM.sessionWeek.value = getDateKey(state.currentWeekStart);
    DOM.sessionId.value = session ? session.id : '';

    DOM.deleteSessionBtn.classList.toggle('hidden', !session);
    showModal('sessionModal');
}

function handleSessionSubmit(e) {
    e.preventDefault();
    const traineeId = DOM.sessionTrainee.value;
    const title = DOM.sessionTitle.value.trim();
    const type = DOM.sessionType.value;
    const notes = DOM.sessionNotes.value.trim();
    const day = parseInt(DOM.sessionDay.value);
    const time = DOM.sessionTime.value;
    const week = DOM.sessionWeek.value;

    if (!traineeId || !title) return;

    if (state.editingSessionId) {
        const session = state.sessions.find(s => s.id === state.editingSessionId);
        if (session) {
            session.traineeId = traineeId;
            session.title = title;
            session.type = type;
            session.notes = notes;
        }
    } else {
        state.sessions.push({ id: generateId(), traineeId, title, type, notes, day, time, week });
    }

    saveData();
    renderCurrentView();
    closeModal('sessionModal');
}

function deleteSession() {
    if (!state.editingSessionId || !confirm('Are you sure you want to delete this session?')) return;

    state.sessions = state.sessions.filter(s => s.id !== state.editingSessionId);
    saveData();
    renderCurrentView();
    closeModal('sessionModal');
}

// Import/Export
function exportData() {
    const data = { trainees: state.trainees, sessions: state.sessions, dayBookings: state.dayBookings, exportedAt: new Date().toISOString() };
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
            if (data.trainees) state.trainees = data.trainees;
            if (data.sessions) state.sessions = data.sessions;
            if (data.dayBookings) state.dayBookings = data.dayBookings;
            saveData();
            renderTraineeList();
            renderCurrentView();
            alert('Data imported successfully!');
        } catch (err) {
            alert('Error importing data. Please make sure the file is valid JSON.');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// Modal Utilities
function showModal(modalId) { DOM[modalId].classList.remove('hidden'); }
function closeModal(modalId) { DOM[modalId].classList.add('hidden'); }

// Helper Functions
function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

function getRandomColor() {
    const colors = ['#4a90d9', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function adjustColor(color, amount) {
    const clamp = n => Math.min(255, Math.max(0, n));
    const hex = color.replace('#', '');
    const r = clamp(parseInt(hex.substr(0, 2), 16) + amount);
    const g = clamp(parseInt(hex.substr(2, 2), 16) + amount);
    const b = clamp(parseInt(hex.substr(4, 2), 16) + amount);
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Day Booking Management
function openBookingModal(dateKey, bookingId = null) {
    state.editingBookingId = bookingId;
    updateTraineeSelect(DOM.bookingTrainee);

    const existingBooking = bookingId ? state.dayBookings.find(b => b.id === bookingId) : null;
    const today = getTodayInfo();
    const isFutureDate = dateKey > today.key;

    DOM.bookingModalTitle.textContent = existingBooking ? 'Edit Training Day' : 'Add Training Day';
    DOM.bookingTrainee.value = existingBooking ? existingBooking.traineeId : '';
    DOM.bookingHours.value = existingBooking ? existingBooking.hours : 8;
    DOM.bookingDate.value = dateKey;
    DOM.bookingId.value = bookingId || '';

    // Update status options based on date
    // Future dates: only "planned" allowed
    // Today/past dates: both options allowed
    updateStatusOptions(isFutureDate, existingBooking ? existingBooking.status : 'planned');

    DOM.deleteBookingBtn.classList.toggle('hidden', !existingBooking);
    updateWeeklyHoursInfo();
    showModal('bookingModal');
}

// Update status select options based on date
function updateStatusOptions(isFutureDate, currentStatus) {
    if (isFutureDate) {
        // Future dates: only planned allowed
        DOM.bookingStatus.innerHTML = '<option value="planned">Planned</option>';
        DOM.bookingStatus.value = 'planned';
    } else {
        // Today or past: both options allowed
        DOM.bookingStatus.innerHTML = `
            <option value="planned">Planned</option>
            <option value="present">Present</option>
        `;
        DOM.bookingStatus.value = currentStatus;
    }
}

function updateWeeklyHoursInfo() {
    const traineeId = DOM.bookingTrainee.value;
    const dateKey = DOM.bookingDate.value;

    if (!traineeId || !dateKey) {
        DOM.weeklyHoursInfo.textContent = '';
        return;
    }

    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weeklyHours = getWeeklyHoursForTrainee(traineeId, date);
    const remaining = MAX_WEEKLY_HOURS - weeklyHours;

    const bookingId = DOM.bookingId.value;
    if (bookingId) {
        const existingBooking = state.dayBookings.find(b => b.id === bookingId);
        if (existingBooking && existingBooking.traineeId === traineeId) {
            DOM.weeklyHoursInfo.textContent = `Weekly: ${weeklyHours}h used, ${remaining + existingBooking.hours}h available (including current)`;
            return;
        }
    }

    DOM.weeklyHoursInfo.textContent = `Weekly: ${weeklyHours}h used, ${remaining}h available (max ${MAX_WEEKLY_HOURS}h/week)`;
    DOM.weeklyHoursInfo.style.color = remaining <= 0 ? '#e74c3c' : '#666';
}

function handleBookingSubmit(e) {
    e.preventDefault();
    const traineeId = DOM.bookingTrainee.value;
    const hours = parseInt(DOM.bookingHours.value);
    let status = DOM.bookingStatus.value;
    const dateKey = DOM.bookingDate.value;
    const bookingId = DOM.bookingId.value;

    if (!traineeId || !hours || !dateKey) return;

    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = getTodayInfo();

    // Enforce status restriction: future dates can only be "planned"
    if (dateKey > today.key && status === 'present') {
        status = 'planned';
    }

    if (!canAddHours(traineeId, date, hours, bookingId || null)) {
        alert(`Cannot add ${hours} hours. Would exceed weekly limit of ${MAX_WEEKLY_HOURS} hours for this trainee.`);
        return;
    }

    if (bookingId) {
        const booking = state.dayBookings.find(b => b.id === bookingId);
        if (booking) {
            booking.traineeId = traineeId;
            booking.hours = hours;
            booking.status = status;
        }
    } else {
        state.dayBookings.push({ id: generateId(), date: dateKey, traineeId, hours, status });
    }

    saveData();
    renderCurrentView();
    renderTraineeList(); // Update weekly hours display
    closeModal('bookingModal');
}

function deleteBooking() {
    const bookingId = DOM.bookingId.value;
    if (!bookingId || !confirm('Are you sure you want to delete this training day?')) return;

    state.dayBookings = state.dayBookings.filter(b => b.id !== bookingId);
    saveData();
    renderCurrentView();
    renderTraineeList(); // Update weekly hours display
    closeModal('bookingModal');
}

// Global exports for inline handlers
window.editTrainee = editTrainee;
window.deleteTrainee = deleteTrainee;
window.switchView = switchView;
window.openBookingModal = openBookingModal;
