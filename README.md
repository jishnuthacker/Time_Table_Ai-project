# 🧬 Timetable Scheduler — Genetic Algorithm

An AI-powered **university course timetable generator** that uses a **Genetic Algorithm (GA)** to produce conflict-free schedules. It features a modern web interface for configuring inputs, visualizing results, and exporting schedules.

![Python](https://img.shields.io/badge/Python-3.8%2B-blue?logo=python&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

---

## ✨ Features

| Feature | Description |
|---|---|
| **Genetic Algorithm Engine** | Evolves a population of candidate schedules over generations to find an optimal, conflict-free timetable. |
| **Hard Constraint Satisfaction** | Guarantees no room-time clashes, no professor conflicts, and no student-group overlaps. |
| **Soft Constraint Optimization** | Optimises for energy efficiency (room utilisation), minimises gaps for students & professors, and rewards consecutive class blocks. |
| **Interactive Web UI** | A sleek, responsive dashboard to configure courses, rooms, time slots, and GA parameters — then visualise the results instantly. |
| **Convergence Plot** | Real-time chart showing how constraint violations decrease across generations. |
| **CSV Export** | Download the generated timetable as a CSV file. |
| **Google Sheets Export** | (Optional) Push the timetable directly to a Google Sheet for easy sharing. |

---

## 🖼️ Screenshots

> Run the app locally and open `http://localhost:8080` to see the UI.

---

## 🏗️ Project Structure

```
📦 Time_Table_Ai-project/
├── server.py                  # Python HTTP server (serves UI + exposes /api/run)
├── timetable_ga.py            # Core Genetic Algorithm engine
├── __init__.py                # Python package marker
├── credentials.json.example   # Template for Google Sheets API credentials
├── GOOGLE_SHEETS_SETUP.md     # Detailed Google Sheets setup guide
├── static/
│   ├── index.html             # Web UI — main page
│   ├── style.css              # Styling (dark navy theme, animations)
│   └── script.js              # Frontend logic (API calls, chart, exports)
├── requirements.txt           # Python dependencies
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+** installed on your system.

### 1. Clone the Repository

```bash
git clone https://github.com/jishnuthacker/Time_Table_Ai-project.git
cd Time_Table_Ai-project
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Server

```bash
python server.py
```

### 4. Open in Browser

Navigate to **[http://localhost:8080](http://localhost:8080)** in your browser.

---

## ⚙️ How It Works

### Genetic Algorithm Overview

```
┌──────────────┐
│  Initialize   │  Random population of candidate schedules
│  Population   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Evaluate    │  Fitness = -(hard penalties) + soft score
│   Fitness     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Selection    │  Tournament selection (top-k)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Crossover    │  Single-point crossover between parents
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Mutation     │  Random gene mutation (room + timeslot)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Converged?   │──No──▶ Loop back to Evaluate
└──────┬───────┘
       │ Yes
       ▼
   Best Schedule
```

### Constraints

**Hard Constraints** (must be satisfied):
- No two courses in the same room at the same time
- No professor teaching two courses simultaneously
- No student group attending two courses at the same time
- Room capacity must accommodate the course enrollment

**Soft Constraints** (optimised for quality):
- Minimise idle gaps for students between classes
- Minimise idle gaps for professors
- Maximise room utilisation efficiency (energy savings)
- Reward consecutive time blocks for the same course

---

## 🔧 Configuration

The web UI allows you to customise:

| Parameter | Default | Description |
|---|---|---|
| **Days** | Mon–Fri | Available scheduling days |
| **Time Slots** | 7 per day | Time windows per day (e.g., 8-9, 9-10, …) |
| **Courses** | 10 sample | Course name, professor, branch, division, capacity |
| **Rooms** | 5 sample | Room name and seating capacity |
| **Population Size** | 100 | Number of candidate schedules per generation |
| **Mutation Rate** | 0.05 | Probability of random gene mutation |
| **Crossover Rate** | 0.80 | Probability of crossover between parents |
| **Max Generations** | 500 | Stopping criterion if no perfect solution found |

---

## 📦 Google Sheets Export

Export your generated timetable directly to Google Sheets for easy sharing with faculty and students.

### Quick Setup (Recommended)

1. **Create a Google Sheet** in your Google Drive (or use an existing one).
2. **Share the sheet** with the following service account email as **Editor**:

   ```
   timetable@eloquent-clover-435616-m1.iam.gserviceaccount.com
   ```

3. **Copy the sheet URL** (e.g., `https://docs.google.com/spreadsheets/d/abc123.../edit`).
4. **Paste the URL** into the **"Google Spreadsheet Link"** field in the app's configuration panel (Step 05).
5. **Generate your timetable**, then click the **"Google Sheets"** button in the results panel to export.

### Install Required Libraries

```bash
pip install gspread google-auth
```

### Credentials Setup

If you're setting up your own service account:

1. Create a **Google Cloud Project** and enable the **Google Sheets API** and **Google Drive API**.
2. Create a **Service Account** and download the JSON key file.
3. Rename it to `credentials.json` and place it in the project root folder.

> See [`GOOGLE_SHEETS_SETUP.md`](GOOGLE_SHEETS_SETUP.md) for the full, detailed guide.

### Troubleshooting

| Problem | Solution |
|---|---|
| **"Drive storage quota exceeded"** | Service accounts have 0 GB storage. Always paste an **existing** spreadsheet link shared with the service account — don't rely on auto-creation. |
| **"Invalid argument" error** | Make sure you pasted the full Google Sheet URL (not a folder URL) in the Spreadsheet Link field. |
| **Sheet not updating** | Verify the sheet is shared with `timetable@eloquent-clover-435616-m1.iam.gserviceaccount.com` as **Editor**. |

---

## 🛠️ Tech Stack

- **Backend**: Python 3 (standard library `http.server` — no frameworks needed)
- **AI/Algorithm**: Custom Genetic Algorithm implementation
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Charting**: Canvas-based convergence plots
- **Fonts**: Inter & JetBrains Mono (Google Fonts)

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👥 Author & Collaborators

**Jishnu Thacker** (Project Lead)
- GitHub: [@jishnuthacker](https://github.com/jishnuthacker)

**Rikin Parekh** (Collaborator)
- GitHub: [@RikinParekh15147](https://github.com/RikinParekh15147)

**Shlok Patel** (Collaborator)
- GitHub: [@ShlokPatel27](https://github.com/ShlokPatel27)

---

<p align="center">Made with ❤️ and Genetic Algorithms</p>
