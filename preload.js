const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  minimize:        () => ipcRenderer.send("window-minimize"),
  maximize:        () => ipcRenderer.send("window-maximize"),
  close:           () => ipcRenderer.send("window-close"),
  onUpdateReady:   (cb) => ipcRenderer.once("update-ready", cb),
  restartAndUpdate: () => ipcRenderer.send("restart-and-update"),
});
