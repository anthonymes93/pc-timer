const { app, BrowserWindow, screen } = require("electron");

let popupWindows = [];
let lastTriggered = "";

function closeAllPopups() {
  popupWindows.forEach((win) => {
    if (win && !win.isDestroyed()) {
      win.close();
    }
  });

  popupWindows = [];
}

function createPopup(display, message, subtitle) {
  const { x, y, width, height } = display.workArea;

  const popupWidth = 460;
  const popupHeight = 260;

  const win = new BrowserWindow({
    width: popupWidth,
    height: popupHeight,
    x: Math.round(x + width / 2 - popupWidth / 2),
    y: Math.round(y + height / 2 - popupHeight / 2),
    frame: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.setAlwaysOnTop(true, "screen-saver");

  win.on("closed", () => {
    closeAllPopups();
  });

  const html = `
    <html>
      <body style="
        margin:0;
        font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        background:linear-gradient(135deg, #111827, #1f2937);
        color:white;
        height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        overflow:hidden;
      ">
        <div style="
          width:86%;
          padding:26px;
          border-radius:24px;
          background:rgba(255,255,255,0.08);
          border:1px solid rgba(255,255,255,0.18);
          box-shadow:0 25px 60px rgba(0,0,0,0.45);
          text-align:center;
          backdrop-filter:blur(18px);
        ">
          <div style="font-size:34px;margin-bottom:12px;">⏱️</div>
          <h1 style="margin:0 0 8px;font-size:28px;">${message}</h1>
          <p style="margin:0 0 22px;color:rgba(255,255,255,0.72);font-size:15px;">
            ${subtitle}
          </p>
          <button onclick="window.close()" style="
            border:none;
            border-radius:999px;
            padding:12px 24px;
            background:white;
            color:#111827;
            font-size:14px;
            font-weight:700;
            cursor:pointer;
          ">
            Got it
          </button>
        </div>

        <script>
          const audio = new Audio(
            "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAA"
          );
          audio.play().catch(() => {});
        </script>
      </body>
    </html>
  `;

  win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));

  setTimeout(() => {
    if (!win || win.isDestroyed()) return;

    const bounds = win.getBounds();
    const originalX = bounds.x;
    const originalY = bounds.y;

    let shakes = 0;

    const shakeInterval = setInterval(() => {
      if (!win || win.isDestroyed()) {
        clearInterval(shakeInterval);
        return;
      }

      win.setBounds({
        x: originalX + Math.round(Math.random() * 20 - 10),
        y: originalY + Math.round(Math.random() * 20 - 10),
        width: bounds.width,
        height: bounds.height
      });

      shakes++;

      if (shakes > 20) {
        clearInterval(shakeInterval);

        if (win && !win.isDestroyed()) {
          win.setBounds({
            x: originalX,
            y: originalY,
            width: bounds.width,
            height: bounds.height
          });
        }
      }
    }, 40);
  }, 500);

  popupWindows.push(win);
}

function showPopupsOnAllScreens(message, subtitle) {
  closeAllPopups();

  const displays = screen.getAllDisplays();

  displays.forEach((display) => {
    createPopup(display, message, subtitle);
  });
}

function checkTime() {
  const now = new Date();
  const minutes = now.getMinutes();
  const hour = now.getHours();

  const triggerKey = `${hour}:${minutes}`;

  if ((minutes === 0 || minutes === 40) && lastTriggered !== triggerKey) {
    lastTriggered = triggerKey;

    if (minutes === 40) {
      showPopupsOnAllScreens(
        "START COMPUTER TIME",
        "You have 20 minutes. Use the computer intentionally."
      );
    }

    if (minutes === 0) {
      showPopupsOnAllScreens(
        "STOP COMPUTER TIME",
        "Time to get off the computer and take a real break."
      );
    }
  }
}

app.whenReady().then(() => {
  checkTime();
  setInterval(checkTime, 1000);
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});