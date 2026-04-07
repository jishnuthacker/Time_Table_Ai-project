# 🧬 Timetable Scheduler - Genetic Algorithm

An AI-powered **university course timetable generator** that uses a **Genetic Algorithm (GA)** to produce conflict-free schedules. It features a modern web interface for configuring inputs, visualizing results, and exporting schedules.

![Python](https://img.shields.io/badge/Python-3.8%2B-blue?logo=python&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

---

## ✨ Features

| Feature | Description |
|---|---|
| **Theory & Lab Split** | Intelligent handling of 1-hour theory sessions and 2-hour lab blocks with custom durations. |
| **Batch-wise Scheduling** | Automatically assigns labs to multiple batches while ensuring no student-group overlaps. |
| **Dedicated Lab Rooms** | Strict enforcement of room-subject mapping for specialized laboratories. |
| **Hard Constraint Satisfaction** | Zero room-time clashes, zero professor conflicts, and zero student-group overlaps. |
| **Time Slot Preferences** | Optimization for "Morning Theory" and "Afternoon/Evening Labs" to match academic best practices. |
| **Lunch Window** | Guarantees at least one free slot for students and faculty during specified break times. |
| **Multi-View UI** | Visualize the timetable by Day, by Room, or by Batch with real-time filtering and sorting. |
| **Exports** | Download results as CSV or push directly to a shared Google Spreadsheet. |

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

**Hard Constraints** (Satisfied by best solutions):
- **Conflict-Free**: No overlapping sessions for the same room, professor, or student batch.
- **Duration Enforce**: Lab sessions are strictly 2-hour consecutive blocks.
- **Dedicated Labs**: Lab sessions must occur in rooms specifically mapped to that subject.
- **Room Segregation**: Theory courses are only placed in designated Theory Rooms.
- **Boundary Checks**: No sessions can start or overflow past the day's time slots.
- **Lunch Break**: At least one slot in the lunch window is guaranteed free.
- **No Repeats**: A course cannot appear twice on the same day for the same batch.

**Soft Constraints** (Optimised for quality):
- **Morning Theory**: Preference for scheduling theory sessions in the first half of the day.
- **Afternoon Labs**: Preference for scheduling lab sessions in the latter half.
- **Idle Gap Reduction**: (Core logic) Minimising "dead time" for both students and faculty.
- **Resource Efficiency**: Optimising seating utilization across theory rooms.

---

## 🔧 Configuration

The web UI is organized into 8 configuration sections:

| Section | Description | Key Parameters |
|---|---|---|
| **01 Basics** | Core schedule structure | Working Days, Time Slots, Student Batches |
| **02 Theory** | Standard classroom courses | Course Name, Faculty, Credits (hrs/week) |
| **03 Labs** | Practical/Lab sessions | Lab Name, Faculty, Dedicated Room |
| **04/05 Rooms** | Space management | Capacity for TheoryRooms; Subject-mapping for LabRooms |
| **06 Constraints** | Quality of life settings | Lunch window bounds, Morning/Afternoon preferences |
| **07 GA Engine** | Algorithm tuning | Pop Size (10-500), Max Generations, Mutation/Crossover rates |
| **08 Export** | Integration settings | Google Spreadsheet URL, Service Account sharing |

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
4. **Paste the URL** into the **"Google Spreadsheet URL"** field in the app's configuration panel (**Section 08**).
5. **Generate your timetable**, then click the **"Export to Sheets"** button in the results panel to export.

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
