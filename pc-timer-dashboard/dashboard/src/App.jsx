import { useEffect, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  onSnapshot,
  updateDoc
} from "firebase/firestore";
import "./App.css";

const firebaseConfig = {
  apiKey: "AIzaSyCO3VDNkgPXqBR3mDSeWZucuptY7pzPGGM",
  authDomain: "pc-timer.firebaseapp.com",
  projectId: "pc-timer",
  storageBucket: "pc-timer.firebasestorage.app",
  messagingSenderId: "950166819470",
  appId: "1:950166819470:web:cfe6974fac1b644d60efdf"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const settingsRef = doc(db, "settings", "pcTimer");

export default function App() {
  const [settings, setSettings] = useState({
    enabled: true,
    startMinute: 40,
    stopMinute: 0,
    startTitle: "",
    startMessage: "",
    stopTitle: "",
    stopMessage: "",
    showTestOnOpen: false
  });
  const [saving, setSaving] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) setSettings(snapshot.data());
      setConnected(true);
    });
    return () => unsub();
  }, []);

  async function saveSettings() {
    setSaving(true);
    await updateDoc(settingsRef, settings);
    setSaving(false);
  }

  function updateField(field, value) {
    setSettings((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="page">
      <TitleBar />
      <div className="container">
        <div className="header">
          <div>
            <div className="overline">Configuration</div>
            <h1 className="title">PC Timer Dashboard</h1>
            <p className="subtitle">Control your Electron popup timer from anywhere.</p>
          </div>
          <div className={`live-badge${connected ? " connected" : ""}`}>
            <span className="live-dot" />
            {connected ? "Live" : "Connecting…"}
          </div>
        </div>

        <div className="card">
          <div className="section">
            <div className="section-title">General</div>
            <div className="toggles">
              <Toggle
                label="Timer Enabled"
                description="Activate the popup schedule"
                checked={!!settings.enabled}
                onChange={(v) => updateField("enabled", v)}
              />
              <Toggle
                label="Show Test Popup on Open"
                description="Display a test notification when the app launches"
                checked={!!settings.showTestOnOpen}
                onChange={(v) => updateField("showTestOnOpen", v)}
              />
            </div>
          </div>

          <div className="divider" />

          <div className="section">
            <div className="section-title">Schedule</div>
            <div className="grid">
              <Field
                label="Start Minute"
                type="number"
                value={settings.startMinute}
                onChange={(v) => updateField("startMinute", Number(v))}
              />
              <Field
                label="Stop Minute"
                type="number"
                value={settings.stopMinute}
                onChange={(v) => updateField("stopMinute", Number(v))}
              />
            </div>
          </div>

          <div className="divider" />

          <div className="section">
            <div className="section-title">Start Popup</div>
            <Field
              label="Title"
              value={settings.startTitle}
              onChange={(v) => updateField("startTitle", v)}
            />
            <TextArea
              label="Message"
              value={settings.startMessage}
              onChange={(v) => updateField("startMessage", v)}
            />
          </div>

          <div className="divider" />

          <div className="section">
            <div className="section-title">Stop Popup</div>
            <Field
              label="Title"
              value={settings.stopTitle}
              onChange={(v) => updateField("stopTitle", v)}
            />
            <TextArea
              label="Message"
              value={settings.stopMessage}
              onChange={(v) => updateField("stopMessage", v)}
            />
          </div>

          <div className="save-row">
            <button
              className={`save-btn${saving ? " saving" : ""}`}
              onClick={saveSettings}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner" />
                  Saving…
                </>
              ) : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="toggle-row" onClick={() => onChange(!checked)}>
      <div className="toggle-text">
        <span className="toggle-label-text">{label}</span>
        {description && <span className="toggle-desc">{description}</span>}
      </div>
      <div className={`toggle-track${checked ? " on" : ""}`}>
        <div className="toggle-thumb" />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="field-input"
      />
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="field-textarea"
      />
    </div>
  );
}

function TitleBar() {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef(null);

  function show() {
    clearTimeout(hideTimer.current);
    setVisible(true);
  }

  function hide() {
    hideTimer.current = setTimeout(() => setVisible(false), 300);
  }

  return (
    <>
      <div className="titlebar-trigger" onMouseEnter={show} />
      <div
        className={`titlebar${visible ? " titlebar--visible" : ""}`}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        <div className="titlebar-drag">
          <span className="titlebar-name">PC Timer</span>
        </div>
        <div className="titlebar-controls">
          <button
            className="tb-btn tb-minimize"
            onClick={() => window.electronAPI?.minimize()}
            title="Minimize"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7.25" width="10" height="1.5" rx="0.75" fill="currentColor" />
            </svg>
          </button>
          <button
            className="tb-btn tb-maximize"
            onClick={() => window.electronAPI?.maximize()}
            title="Maximize / Restore"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <button
            className="tb-btn tb-close"
            onClick={() => window.electronAPI?.close()}
            title="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
