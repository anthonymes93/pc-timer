import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  onSnapshot,
  updateDoc
} from "firebase/firestore";

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

  useEffect(() => {
    const unsub = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) setSettings(snapshot.data());
    });

    return () => unsub();
  }, []);

  async function saveSettings() {
    setSaving(true);
    await updateDoc(settingsRef, settings);
    setSaving(false);
    alert("Settings saved.");
  }

  function updateField(field, value) {
    setSettings((prev) => ({
      ...prev,
      [field]: value
    }));
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>PC Timer Dashboard23</h1>
        <p style={styles.subtitle}>
          Control your Electron popup timer from anywhere.
        </p>

        <div style={styles.card}>
          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={!!settings.enabled}
              onChange={(e) => updateField("enabled", e.target.checked)}
            />
            Timer Enabled
          </label>

          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={!!settings.showTestOnOpen}
              onChange={(e) =>
                updateField("showTestOnOpen", e.target.checked)
              }
            />
            Show test popup on app open
          </label>

          <div style={styles.grid}>
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

          <Field
            label="Start Title"
            value={settings.startTitle}
            onChange={(v) => updateField("startTitle", v)}
          />

          <TextArea
            label="Start Message"
            value={settings.startMessage}
            onChange={(v) => updateField("startMessage", v)}
          />

          <Field
            label="Stop Title"
            value={settings.stopTitle}
            onChange={(v) => updateField("stopTitle", v)}
          />

          <TextArea
            label="Stop Message"
            value={settings.stopMessage}
            onChange={(v) => updateField("stopMessage", v)}
          />

          <button style={styles.button} onClick={saveSettings}>
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
      />
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={styles.textarea}
      />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(99,102,241,.25), transparent 35%), linear-gradient(135deg,#020617,#111827)",
    color: "white",
    fontFamily: "Arial, sans-serif",
    padding: 24
  },
  container: {
    maxWidth: 850,
    margin: "0 auto"
  },
  title: {
    fontSize: 42,
    marginBottom: 8
  },
  subtitle: {
    color: "rgba(255,255,255,.65)",
    marginBottom: 28
  },
  card: {
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 30px 80px rgba(0,0,0,.35)"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 18
  },
  field: {
    marginBottom: 18
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontWeight: 700
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: 14,
    borderRadius: 12,
    border: "none",
    background: "#1e293b",
    color: "white",
    fontSize: 16
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: 14,
    borderRadius: 12,
    border: "none",
    background: "#1e293b",
    color: "white",
    fontSize: 16,
    minHeight: 110,
    resize: "vertical"
  },
  checkboxRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginBottom: 18,
    fontWeight: 700
  },
  button: {
    border: "none",
    borderRadius: 999,
    padding: "16px 26px",
    background: "white",
    color: "#020617",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer"
  }
};