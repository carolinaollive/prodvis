const { app, BrowserWindow, screen, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');

let tray = null;
let win = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;

  const winWidth = 320;
  const winHeight = 180;

  win = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: screenWidth - winWidth - 2,
    y: 32,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  // Keep window level above others and visible on all workspaces
  win.setAlwaysOnTop(true, 'floating', 1);
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Enable click-through on transparent areas by default
  win.setIgnoreMouseEvents(true, { forward: true });

  // In production, load the built files
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    win.loadURL('http://localhost:5173');
  }
}

// IPC handlers for click-through toggling from renderer
function setupIPC() {
  ipcMain.on('set-ignore-mouse-events', (_event, ignore, options) => {
    if (win) {
      win.setIgnoreMouseEvents(ignore, options || {});
    }
  });
}

function createTray() {
  const assetsDir = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, 'assets');

  let icon;

  if (process.platform === 'darwin') {
    // macOS: use trayIcon.png (16px) + trayIcon@2x.png (32px retina) as template
    const iconPath = path.join(assetsDir, 'trayIcon.png');
    icon = nativeImage.createFromPath(iconPath);
    icon.setTemplateImage(true);
  } else {
    // Windows/Linux: use the full-color 32px icon
    const iconPath = path.join(assetsDir, 'icon-32.png');
    icon = nativeImage.createFromPath(iconPath);
  }

  tray = new Tray(icon);
  tray.setToolTip('Enduring');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Widget',
      click: () => win.show()
    },
    {
      label: 'Hide Widget',
      click: () => win.hide()
    },
    { type: 'separator' },
    {
      label: 'Reset Position',
      click: () => {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth } = primaryDisplay.workAreaSize;
        win.setPosition(screenWidth - 320 - 2, 32);
        win.show();
      }
    },
    { type: 'separator' },
    { label: 'Quit Enduring', click: () => app.quit() }
  ]);

  tray.setContextMenu(contextMenu);

  // Click on tray toggles visibility
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

  setupIPC();
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
