# Trainee Timetable

A simple web application for managing trainee schedules and timetables.

## Features

- **Trainee Management**: Add, edit, and remove trainees
- **Week/Month Views**: Toggle between weekly timetable and monthly calendar
- **Timetable View**: Weekly timetable grid with time slots (Monday - Sunday)
- **Monthly View**: Full month calendar with holiday details and session counts
- **Day Booking**: Book training days for trainees with status tracking (planned/present)
- **Training Hours**: Track daily hours (max 8/day) with weekly limit of 20 hours per trainee
- **Weekend Display**: Saturday and Sunday visible in grey, non-editable
- **Bulgarian Holidays 2026**: Public holidays with detailed descriptions (1-2 sentences)
- **Session Scheduling**: Schedule training sessions for trainees
- **Color-coded Sessions**: Different colors for different session types
- **Data Persistence**: Saves data locally in browser storage
- **Export/Import**: Export timetable data as JSON for backup

## Getting Started

Simply open `index.html` in a web browser to start using the application.

### No Build Required

This is a vanilla HTML/CSS/JavaScript application with no dependencies.

## Usage

1. **Add Trainees**: Click "Add Trainee" to create a new trainee entry
2. **Schedule Sessions**: Click on a timetable cell to add a session
3. **Edit Sessions**: Click on existing sessions to modify or delete them
4. **Export Data**: Use the export button to save your data as JSON

## Project Structure

```
trainee-timetable/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Application styles
├── js/
│   └── app.js          # Main application logic
└── README.md           # This file
```

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

## Changelog

### v1.4.0
- **Feature**: Added Day Booking functionality in Monthly View
- Book training days for trainees by clicking on calendar days
- Status tracking: "Planned" (orange) and "Present" (green) states
- Training hours input (1-8 hours per day)
- Weekly hours limit of 20 hours per trainee with real-time validation
- Visual display of bookings with trainee name, hours, and status
- Edit and delete existing bookings
- **Bugfix**: Fixed timezone bug affecting New Year's Day display

### v1.3.0
- **Feature**: Added Monthly View with full calendar display
- Toggle between Week View and Month View with buttons
- Holiday descriptions expanded to 1-2 sentences with historical context
- Month view shows holiday badges, names, and full descriptions
- Session counts displayed in monthly view for each day

### v1.2.0
- **Feature**: Added Bulgarian public holidays for 2026
- Holidays displayed with red date numbers and short abbreviations
- Holiday cells are non-editable (view-only)
- Header shows date numbers for each day of the week
- Holidays included: New Year, Liberation Day, Easter (Orthodox), Labour Day, St. George's Day, Education Day, Unification Day, Independence Day, Christmas

### v1.1.0
- **Feature**: Added Saturday and Sunday columns to the timetable
- Weekend days are displayed in grey and are non-editable (view-only)
- Week display now shows full Monday - Sunday range

### v1.0.0
- Initial release with trainee management and session scheduling

## License

MIT License
