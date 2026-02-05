const { app, BrowserWindow, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let tray = null;
let win = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;

  const winWidth = 280;
  const winHeight = 140;

  win = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: screenWidth - winWidth - 5,
    y: 28,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // In production, load the built files
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    win.loadURL('http://localhost:5173');
  }
}

function createTray() {
  // Create a simple tray icon (16x16 colored circle)
  const iconSize = 16;
  const canvas = `
    <svg width="${iconSize}" height="${iconSize}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" fill="#E8A87C"/>
      <circle cx="8" cy="8" r="3" fill="#85CDCA"/>
    </svg>
  `;

  const icon = nativeImage.createFromDataURL(
    `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`
  );

  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('Habit Tracker');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide',
      click: () => {
        if (win.isVisible()) {
          win.hide();
        } else {
          win.show();
        }
      }
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setContextMenu(contextMenu);

  // Click on tray to toggle visibility
  tray.on('click', () => {
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
    }
  });
}

app.whenReady().then(() => {
  // Hide dock icon on macOS
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
