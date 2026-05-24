const { app, BrowserWindow, screen, ipcMain, Menu } = require("electron");
const { autoUpdater } = require("electron-updater");
const { db, doc, onSnapshot } = require("./firebase");
const path = require("path");

let popupWindows = [];
let controlPanelWindow;
let lastTriggered = "";

const DASHBOARD_URL = app.isPackaged
  ? `file://${path.join(__dirname, "dashboard-dist", "index.html")}`
  : "http://localhost:5174/";

let settings = {
  enabled: true,
  startMinute: 40,
  stopMinute: 0,
  startTitle: "START COMPUTER TIME",
  startMessage: "You have 20 minutes. Use the computer intentionally.",
  stopTitle: "STOP COMPUTER TIME",
  stopMessage: "Step away now. Protect your focus and reset.",
  showTestOnOpen: false,
  workDayStart: 9,
  workDayEnd: 18
};

function openControlPanel() {
  if (controlPanelWindow && !controlPanelWindow.isDestroyed()) {
    controlPanelWindow.focus();
    return;
  }

  controlPanelWindow = new BrowserWindow({
    width: 1100,
    height: 900,
    frame: false,
    backgroundColor: "#020617",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  controlPanelWindow.maximize();
  controlPanelWindow.loadURL(DASHBOARD_URL);
}

function closeAllPopups() {
  const windows = popupWindows.splice(0);
  for (const win of windows) {
    if (!win.isDestroyed()) win.destroy();
  }
}

function createFullscreenPopup(display, screenNumber, message, subtitle, theme = "dark") {
  const bounds = display.bounds;

  const win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false,
    fullscreen: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: "#020617",
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.setMenuBarVisibility(false);
  win.setBounds(bounds);
  win.setAlwaysOnTop(true, "screen-saver");

  win.on("closed", () => {
    popupWindows = popupWindows.filter(w => w !== win);
    closeAllPopups();
  });

  const bgStyle = theme === "green"
    ? `radial-gradient(circle at top left, rgba(34,197,94,0.32), transparent 34%),
       radial-gradient(circle at bottom right, rgba(16,185,129,0.25), transparent 38%),
       linear-gradient(135deg, #022c1a, #064e3b)`
    : `radial-gradient(circle at top left, rgba(99,102,241,0.28), transparent 34%),
       radial-gradient(circle at bottom right, rgba(14,165,233,0.22), transparent 38%),
       linear-gradient(135deg, #020617, #111827)`;

  const btnColor = theme === "green" ? "#022c1a" : "#020617";
  const iconEmoji = theme === "green" ? "🎉" : "⏱️";

  const html = `
    <html>
      <body style="
        margin:0;width:100vw;height:100vh;overflow:hidden;
        background: ${bgStyle};
        color:white;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;
        display:flex;align-items:center;justify-content:center;
      ">
        <div style="
          width:min(760px,86vw);
          padding:54px;
          border-radius:34px;
          background:rgba(255,255,255,0.08);
          border:1px solid rgba(255,255,255,0.18);
          box-shadow:0 40px 120px rgba(0,0,0,0.55);
          text-align:center;
          backdrop-filter:blur(22px);
        ">
          <div style="
            display:inline-flex;
            padding:10px 18px;
            border-radius:999px;
            background:rgba(255,255,255,0.12);
            color:rgba(255,255,255,0.75);
            font-weight:800;
            letter-spacing:0.08em;
            font-size:13px;
            margin-bottom:22px;
            text-transform:uppercase;
          ">
            Screen ${screenNumber}
          </div>

          <div style="font-size:62px;margin-bottom:18px;">${iconEmoji}</div>

          <h1 style="
            margin:0 0 14px;
            font-size:56px;
            line-height:1;
            letter-spacing:-1.8px;
          ">
            ${message}
          </h1>

          <p style="
            margin:0 auto 34px;
            max-width:560px;
            color:rgba(255,255,255,0.72);
            font-size:21px;
            line-height:1.45;
          ">
            ${subtitle}
          </p>

          <button onclick="require('electron').ipcRenderer.send('close-all-popups')" style="
            border:none;
            border-radius:999px;
            padding:18px 34px;
            background:white;
            color:${btnColor};
            font-size:17px;
            font-weight:900;
            cursor:pointer;
            box-shadow:0 18px 50px rgba(0,0,0,0.35);
          ">
            Got it — close all screens
          </button>
        </div>
      </body>
    </html>
  `;

  win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));

  win.once("ready-to-show", () => {
    win.setBounds(bounds);
    win.show();
    win.focus();
    win.setAlwaysOnTop(true, "screen-saver");
  });

  popupWindows.push(win);
}

function showPopupsOnAllScreens(message, subtitle, theme = "dark") {
  closeAllPopups();

  screen.getAllDisplays().forEach((display, index) => {
    createFullscreenPopup(display, index + 1, message, subtitle, theme);
  });
}

function showWorkDayEndPopup() {
  showPopupsOnAllScreens(
    "Work Day Is Over",
    "Have fun for the rest of the day!",
    "green"
  );
}

function checkTime() {
  if (!settings.enabled) return;

  const now = new Date();
  const minutes = now.getMinutes();
  const hour = now.getHours();
  const triggerKey = `${hour}:${minutes}`;

  if (lastTriggered === triggerKey) return;

  // End-of-work-day popup at exactly workDayEnd hour on the hour
  if (hour === settings.workDayEnd && minutes === 0) {
    lastTriggered = triggerKey;
    showWorkDayEndPopup();
    return;
  }

  // Regular timers only fire during work hours
  const inWorkHours = hour >= settings.workDayStart && hour < settings.workDayEnd;
  if (!inWorkHours) return;

  if (minutes === settings.startMinute || minutes === settings.stopMinute) {
    lastTriggered = triggerKey;

    if (minutes === settings.startMinute) {
      showPopupsOnAllScreens(settings.startTitle, settings.startMessage);
    }

    // Don't fire stop at workDayStart:stopMinute when stopMinute comes before
    // startMinute — no session has happened yet at that point in the first hour
    const stopIsAfterStartInHour = settings.stopMinute > settings.startMinute;
    const pastFirstHour = hour > settings.workDayStart;
    if (minutes === settings.stopMinute && (pastFirstHour || stopIsAfterStartInHour)) {
      showPopupsOnAllScreens(settings.stopTitle, settings.stopMessage);
    }
  }
}

function setupFirebaseSettings() {
  const settingsRef = doc(db, "settings", "pcTimer");

  onSnapshot(settingsRef, (snapshot) => {
    if (!snapshot.exists()) return;

    settings = {
      ...settings,
      ...snapshot.data()
    };

    console.log("Firebase settings updated:", settings);

    if (settings.showTestOnOpen) {
      showPopupsOnAllScreens(
        "FIREBASE CONNECTED",
        "Your popup settings are now controlled by Firestore."
      );
    }
  });
}

function setupUpdater() {
  autoUpdater.autoDownload = true;

  autoUpdater.on("update-downloaded", () => {
    controlPanelWindow?.webContents.send("update-ready");
  });

  autoUpdater.checkForUpdates().catch(() => {});
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);

  ipcMain.on("close-all-popups", () => closeAllPopups());
  ipcMain.on("window-minimize", () => controlPanelWindow?.minimize());
  ipcMain.on("window-maximize", () => {
    if (controlPanelWindow?.isMaximized()) controlPanelWindow.unmaximize();
    else controlPanelWindow?.maximize();
  });
  ipcMain.on("window-close", () => controlPanelWindow?.close());
  ipcMain.on("restart-and-update", () => autoUpdater.quitAndInstall(true, true));

  openControlPanel();
  setupFirebaseSettings();
  setupUpdater();

  checkTime();
  setInterval(checkTime, 1000);
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});