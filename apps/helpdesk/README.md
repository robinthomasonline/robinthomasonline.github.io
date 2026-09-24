# Helpdesk & Issue Tracker

A fully customizable helpdesk ticketing tool. Define your own categories and team, log tickets against them, and track each one through Open → Assigned → In Progress → Resolved.

## Features

- **Custom Categories**: Add or remove the ticket categories that make sense for your context — nothing is hardcoded
- **Custom Team**: Add or remove the people tickets can be assigned to
- **Ticket Queue**: Filter by status, search by location/reference/reporter, sort urgent tickets to the top
- **Ticket Details**: Change status and assignment, add timestamped notes, and review the full activity log
- **Report**: Auto-generated breakdown of tickets by category and by location
- **CSV Export**: Download the full ticket list at any time
- **Local Storage Persistence**: Categories, team, and tickets are saved in your browser and picked up again on your next visit

## Usage

1. Add your categories under **Categories** and your team under **Team**
2. Fill out **Log a Ticket** to add a new ticket to the queue
3. Use the tabs and search box in **Ticket Queue** to find tickets, and the row controls to assign or change status
4. Click **Details** on any ticket to see its full description, activity log, and add notes
5. Use **Export CSV** to download all tickets, or **Clear all data** to start fresh

## Files

- `index.html` - Main application file
- `helpdesk.css` - Stylesheet
- `helpdesk.js` - Application logic

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- Web Storage API (localStorage)
