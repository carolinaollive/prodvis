const { app, BrowserWindow, screen, Tray, Menu, nativeImage } = require('electron');
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
    },
  });

  // Keep window level above others and visible on all workspaces
  win.setAlwaysOnTop(true, 'floating', 1);
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // In production, load the built files
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    win.loadURL('http://localhost:5173');
  }
}

function createTray() {
  // Custom Enduring icon - cross with circles at ends
  // Simplified for 22x22 menu bar size
  const iconSvg = `
    <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 8L19 8C20.66 8 22 6.66 22 5C22 3.34 20.66 2 19 2C17.34 2 16 3.34 16 5L16 8L8 8L8 5C8 3.34 6.66 2 5 2C3.34 2 2 3.34 2 5C2 6.66 3.34 8 5 8L8 8L8 16H16V8Z" fill="black"/>
      <path d="M16 16L19 16C20.66 16 22 17.34 22 19C22 20.66 20.66 22 19 22C17.34 22 16 20.66 16 19L16 16Z" fill="black"/>
      <path d="M5 16L8 16L8 19C8 20.66 6.66 22 5 22C3.34 22 2 20.66 2 19C2 17.34 3.34 16 5 16Z" fill="black"/>
    </svg>
  `;

  const icon = nativeImage.createFromDataURL(
    `data:image/svg+xml;base64,${Buffer.from(iconSvg.trim()).toString('base64')}`
  );

  // Mark as template image so macOS auto-handles dark/light mode
  icon.setTemplateImage(true);

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
