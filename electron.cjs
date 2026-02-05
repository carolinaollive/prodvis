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
  // Load the Enduring icon from assets folder
  // For macOS, we need a PNG template image
  let iconPath;
  if (app.isPackaged) {
    iconPath = path.join(process.resourcesPath, 'assets', 'iconTemplate.png');
  } else {
    iconPath = path.join(__dirname, 'assets', 'iconTemplate.png');
  }

  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
    icon.setTemplateImage(true);
  } catch (e) {
    // Fallback: create a simple icon if file not found
    const fallbackSvg = `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <circle cx="4" cy="4" r="2" fill="black"/>
      <circle cx="12" cy="4" r="2" fill="black"/>
      <circle cx="4" cy="12" r="2" fill="black"/>
      <circle cx="12" cy="12" r="2" fill="black"/>
      <rect x="5" y="3" width="6" height="2" fill="black"/>
      <rect x="5" y="11" width="6" height="2" fill="black"/>
      <rect x="3" y="5" width="2" height="6" fill="black"/>
      <rect x="11" y="5" width="2" height="6" fill="black"/>
    </svg>`;
    icon = nativeImage.createFromDataURL(
      `data:image/svg+xml;base64,${Buffer.from(fallbackSvg).toString('base64')}`
    );
    icon.setTemplateImage(true);
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
