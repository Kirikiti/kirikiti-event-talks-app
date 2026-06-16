# BigQuery Release Hub 🚀

BigQuery Release Hub is a modern, responsive web application that aggregates, parses, and formats the official Google Cloud BigQuery release notes. Built using a lightweight **Python Flask** backend and a plain **HTML5, CSS3, and JavaScript** frontend, it helps cloud engineers and developers stay up to date and share important updates with their community.

---

## 🌟 Features

- **Granular Feed Parsing**: Downloads the official BigQuery Release Notes RSS/Atom feed and dynamically breaks down grouped daily updates into individual, categorized cards (e.g., *Feature*, *Issue*, *Change*, *Deprecation*, *Note*).
- **Interactive Search & Filtering**: Real-time client-side search and pills-based filtering with dynamic counts.
- **Premium Aesthetics**: Clean design optimized for developers with a default dark mode and smooth toggling to light mode using CSS custom properties.
- **Micro-Animations**: Skeleton loaders during network requests, rotating refresh icons, hover card scaling, and smooth modal transitions.
- **X (Twitter) Sharing Modal**: Emulates a post composer card, tracks the 280-character limit dynamically via a circular SVG progress ring, and opens the official X Web Intent for sharing.
- **Developer Utilities**: One-click actions to copy the plain text of an update, copy the direct documentation link, or copy a pre-formatted Markdown block (ideal for Slack, Microsoft Teams, or developer documentation).
- **CSV Data Export**: Download the currently filtered list of release notes as a structured `.csv` file directly through the browser.

---

## 📂 Project Structure

```
bigquery-release-notes/
├── app.py                # Flask main application & XML processing logic
├── templates/
│   └── index.html        # Single Page Application HTML markup
├── static/
│   ├── css/
│   │   └── styles.css    # Typography, dark/light theme, custom styles
│   └── js/
│       └── app.js        # DOM rendering, filtering, copy events & social integrations
├── .gitignore            # File exclusions for Git version control
└── README.md             # Project documentation (this file)
```

---

## 🛠️ Setup and Installation

### Prerequisites
- Python 3.8 or higher installed on your system.

### Steps to Run Locally

1. **Clone or navigate to the repository directory**:
   ```bash
   cd /path/to/bigquery-release-notes
   ```

2. **Create a virtual environment (optional but recommended)**:
   ```bash
   python3 -m venv venv
   ```

3. **Activate the virtual environment**:
   - On Linux/macOS:
     ```bash
     source venv/bin/activate
     ```
   - On Windows (Command Prompt):
     ```cmd
     venv\Scripts\activate
     ```
   - On Windows (PowerShell):
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```

4. **Install the required dependencies**:
   ```bash
   pip install flask requests
   ```

5. **Start the development server**:
   ```bash
   python3 app.py
   ```

6. **Open in browser**:
   Navigate to [http://127.0.0.1:5000](http://127.0.0.1:5000) in your web browser.

---

## ⚙️ Architecture & Data Flow

1. **Data Ingestion**: The backend ([app.py](file:///home/pi/bigquery-release-notes/app.py)) fetches the XML feed from Google Cloud. It uses `xml.etree.ElementTree` to parse the Atom structure.
2. **Normalizations**: GCP feeds bunch multiple updates under a single day entry inside a `<content>` element. The backend splits these by `<h3>` tags, creates a unique ID for each item, cleans relative URLs to absolute GCP links, and strips HTML tags using regex to formulate plain text for sharing.
3. **API Exposure**: The data is served via the `GET /api/release-notes` JSON endpoint.
4. **Client-side Interactivity**: The frontend ([app.js](file:///home/pi/bigquery-release-notes/static/js/app.js)) fetches the payload asynchronously, renders responsive cards, and updates UI search and category counters on-the-fly.

---

## 📄 License
This project is open-source. Content displayed in the application is owned and published by Google Cloud Platform.
