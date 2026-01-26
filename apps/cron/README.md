# Crontab Entry Creator

A web-based tool for creating, understanding, and managing crontab entries. Generate custom cron schedules with a visual builder, explore common templates, and parse existing crontab entries to understand what they do.

## Features

- **Visual Crontab Builder**: Create custom cron entries with an intuitive form interface
- **Quick Select Options**: Pre-defined options for common time values (minutes, hours, days, etc.)
- **Common Templates**: 10 ready-to-use crontab templates with varying complexity levels
- **Crontab Parser**: Enter any existing crontab entry and get a plain-text explanation
- **One-Click Copy**: Copy generated or template entries to clipboard instantly
- **Multiple Selection Support**: Select multiple values for any time field

## Usage

### Creating a Crontab Entry

1. Navigate to the "Create Entry" tab
2. Fill in the time fields (minute, hour, day, month, weekday) or use Quick Select
3. Enter the command to execute
4. Click "Generate Crontab Entry"
5. Copy the generated entry using the Copy button

### Using Templates

1. Navigate to the "Templates" tab
2. Browse through common crontab templates
3. Click "Copy" on any template to copy it to your clipboard
4. Templates are categorized by complexity: Low, Medium, High, Extreme

### Parsing an Entry

1. Navigate to the "Parse Entry" tab
2. Paste your existing crontab entry
3. Click "Parse Entry"
4. Read the plain-text explanation of what the entry does

## Crontab Format

Crontab entries follow this format:
```
minute hour day month weekday command
```

- **minute**: 0-59
- **hour**: 0-23
- **day**: 1-31
- **month**: 1-12
- **weekday**: 0-7 (0 and 7 = Sunday)

Special characters:
- `*` - Any value
- `,` - Value list separator (e.g., 1,3,5)
- `-` - Range (e.g., 9-17)
- `/` - Step values (e.g., */5 means every 5)

## Files

- `index.html` - Main application file
- `cron.css` - Stylesheet
- `cron.js` - Application logic

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- Clipboard API
