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
  // Create a proper template image for macOS menu bar (22x22)
  // Using horizontal bars to represent habit tracking lines
  const iconSvg = `
    <svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="5" width="14" height="2" rx="1" fill="black"/>
      <rect x="4" y="10" width="10" height="2" rx="1" fill="black"/>
      <rect x="4" y="15" width="12" height="2" rx="1" fill="black"/>
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
