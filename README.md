# TaskFlow: Time Management and Task Prioritization System

A responsive website for planning tasks, ranking them by priority and deadline, and getting reminders before they are due. Built as the UI layer of our Java web project.

## Team
- Adarsh Yadav (Team Leader)
- Manvi Malik
- Adarsh Bharti
- Anubhav

## Features
- Add, complete and delete tasks (priority, category, due date and time)
- Priority score: priority weight plus urgency bonus, highest score is shown first
- Priority matrix: Do now, Plan it, Quick finish, Drop or delay
- Live dashboard (total, due today, completed, overdue) and progress bar
- Reminder toast when a task is due within 60 minutes
- Search and filter, responsive layout (desktop, tablet, mobile), 3D cube and tilt cards

## Priority logic
- Score = priority (High 30, Medium 20, Low 10) + urgency (overdue 40, due within 1 day 30, within 3 days 15)
- Urgent = due within 2 days. Important = High or Medium priority.

## Run locally
No installation needed. Download the project and open `index.html` in a browser.

## Host free on GitHub Pages
1. Upload all files to a public repository.
2. Go to Settings, then Pages.
3. Under Source choose the `main` branch and the `/ (root)` folder, then Save.
4. Open the link GitHub shows after a minute.

## Project structure
```
index.html   page structure
style.css    design tokens, layout, 3D effects, responsive rules
app.js       task logic, priority score, reminders, rendering
README.md    project documentation
```

## Tech stack
HTML5, CSS3, JavaScript (browser localStorage for data).

## Next phase (Java backend)
- Servlets (`TaskServlet`, `LoginServlet`) to handle requests
- DAO classes with JDBC and MySQL (`users`, `categories`, `tasks`, `reminders`)
- Replace `load()` and `save()` in `app.js` with calls to the servlets
