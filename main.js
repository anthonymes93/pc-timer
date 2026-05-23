const { app, BrowserWindow, screen, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const { db, doc, onSnapshot } = require("./firebase");

let popupWindows = [];
let controlPanelWindow;
let lastTriggered = "";
let isClosingAll = false;

const DASHBOARD_URL = "http://localhost:5174/";

let settings = {
  enabled: true,
  startMinute: 40,
  stopMinute: 0,
  startTitle: "START COMPUTER TIME",
  startMessage: "You have 20 minutes. Use the computer intentionally.",
  stopTitle: "STOP COMPUTER TIME",
  stopMessage: "Step away now. Protect your focus and reset.",
  showTestOnOpen: false
};

function openControlPanel() {
  if (controlPanelWindow && !controlPanelWindow.isDestroyed()) {
    controlPanelWindow.focus();
    return;
  }

  controlPanelWindow = new BrowserWindow({
    width: 1100,
    height: 900,
    backgroundColor: "#0f172a",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  controlPanelWindow.maximize();
  controlPanelWindow.loadURL(DASHBOARD_URL);
}

function closeAllPopups() {
  if (isClosingAll) return;

  isClosingAll = true;

  const windows = [...popupWindows];
  popupWindows = [];

  windows.forEach((win) => {
    if (win && !win.isDestroyed()) {
      win.destroy();
    }
  });

  isClosingAll = false;
}

function createFullscreenPopup(display, screenNumber, message, subtitle) {
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
    if (!isClosingAll) closeAllPopups();
  });

  const html = `
    <html>
      <body style="
        margin:0;width:100vw;height:100vh;overflow:hidden;
        background:
          radial-gradient(circle at top left, rgba(99,102,241,0.28), transparent 34%),
          radial-gradient(circle at bottom right, rgba(14,165,233,0.22), transparent 38%),
          linear-gradient(135deg, #020617, #111827);
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

          <div style="font-size:62px;margin-bottom:18px;">⏱️</div>

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

          <button onclick="window.close()" style="
            border:none;
            border-radius:999px;
            padding:18px 34px;
            background:white;
            color:#020617;
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

function showPopupsOnAllScreens(message, subtitle) {
  closeAllPopups();

  screen.getAllDisplays().forEach((display, index) => {
    createFullscreenPopup(display, index + 1, message, subtitle);
  });
}

function checkTime() {
  if (!settings.enabled) return;

  const now = new Date();
  const minutes = now.getMinutes();
  const hour = now.getHours();
  const triggerKey = `${hour}:${minutes}`;

  if (
    (minutes === settings.startMinute || minutes === settings.stopMinute) &&
    lastTriggered !== triggerKey
  ) {
    lastTriggered = triggerKey;

    if (minutes === settings.startMinute) {
      showPopupsOnAllScreens(settings.startTitle, settings.startMessage);
    }

    if (minutes === settings.stopMinute) {
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
  autoUpdater.on("update-downloaded", () => {
    dialog
      .showMessageBox({
        type: "info",
        title: "Update Ready",
        message: "A new version of PC Timer has been downloaded.",
        buttons: ["Update now and restart", "Later"]
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  autoUpdater.checkForUpdatesAndNotify().catch(() => {});
}

app.whenReady().then(() => {
  openControlPanel();
  setupFirebaseSettings();
  setupUpdater();

  checkTime();
  setInterval(checkTime, 1000);
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});