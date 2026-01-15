# Trainee Timetable

A simple web application for managing trainee schedules and timetables.

## Features

- **Trainee Management**: Add, edit, and remove trainees
- **Timetable View**: Weekly timetable grid with time slots (Monday - Sunday)
- **Weekend Display**: Saturday and Sunday visible in grey, non-editable
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

### v1.1.0
- **Feature**: Added Saturday and Sunday columns to the timetable
- Weekend days are displayed in grey and are non-editable (view-only)
- Week display now shows full Monday - Sunday range

### v1.0.0
- Initial release with trainee management and session scheduling

## License

MIT License
