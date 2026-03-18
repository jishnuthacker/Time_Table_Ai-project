# 📊 Google Sheets API Setup Guide

To enable the "Create Google Sheet" feature in the Timetable Scheduler, you need to provide a `credentials.json` file. Follow these steps to obtain it:

### 1. Create a Google Cloud Project
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Click the project drop-down and select "New Project".
3.  Give it a name (e.g., `Timetable-GA`) and click "Create".

### 2. Enable APIs
1.  In the Sidebar, go to **APIs & Services > Library**.
2.  Search for and enable:
    -   **Google Sheets API**
    -   **Google Drive API**

### 3. Create a Service Account
1.  Go to **APIs & Services > Credentials**.
2.  Click **+ CREATE CREDENTIALS** and select **Service Account**.
3.  Enter a name (e.g., `timetable-scheduler`) and click **CREATE AND CONTINUE**.
4.  (Optional) Grant "Editor" role if you want the service account to manage files. Click **CONTINUE** and then **DONE**.

### 4. Download JSON Key
1.  In the "Service Accounts" list, click on the email of the account you just created.
2.  Navigate to the **Keys** tab.
3.  Click **ADD KEY > Create new key**.
4.  Select **JSON** and click **Create**.
5.  A file will be downloaded. **Rename this file to `credentials.json`**.

### 5. Final Step
1.  Move the `credentials.json` file into the root folder of this project (`Ai project`).
2.  Restart the application (`python server.py`).

---
> [!NOTE]
> The application will automatically use this file to authenticate and create private Google Sheets, which will then be shared with "Anyone with the link can view".
