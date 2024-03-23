/*
KWin Script Maximized Window Gap
(C) 2024 Abilash Venu <abimagnus@gmail.com>
(C) 2022 Murat Çileli <murat.cileli@gmail.com>
(C) 2021 Natalie Clarius <natalie_clarius@yahoo.de>
GNU General Public License v3.0
*/

const config = {
    gapTop: readConfig("gapTop", 2),
    gapLeft: readConfig("gapLeft", 2),
    gapRight: readConfig("gapRight", 2),
    gapBottom: readConfig("gapBottom", 27),
    offsetTop: readConfig("offsetTop", 0),
    offsetLeft: readConfig("offsetLeft", 0),
    offsetRight: readConfig("offsetRight", 0),
    offsetBottom: readConfig("offsetBottom", 0),
    excludeMode: readConfig("excludeMode", true),
    includeMode: readConfig("includeMode", false),
    excludedApps: readConfig("excludedApps", "").split(/,\s|,/),
    includedApps: readConfig("includedApps", "").split(/,\s|,/)
};

var block = false;

workspace.windowList().forEach(client => onAdded(client));
workspace.windowAdded.connect(onAdded);

function onAdded(client) {
    applyGaps(client);
    onRegeometrized(client);
}

function onRegeometrized(client) {
    client.frameGeometryChanged.connect(() => {
        applyGaps(client)
    });
    client.fullScreenChanged.connect(() => {
        applyGaps(client);
    });
    client.maximizedChanged.connect(() => {
        applyGaps(client);
    });
    client.minimizedChanged.connect(() => {
        applyGaps(client);
    });
    client.quickTileModeChanged.connect(() => {
        applyGaps(client);
    });
    client.desktopsChanged.connect(() => {
        applyGaps(client);
    });
    client.activitiesChanged.connect(() => {
        applyGaps(client);
    });
}

function applyGapsAll() {
    workspace.windowList().forEach(client => applyGaps(client));
}

onRelayouted();

function onRelayouted() {
    workspace.currentDesktopChanged.connect(() => {
        applyGapsAll();
    });
    workspace.desktopLayoutChanged.connect(() => {
        applyGapsAll();
    });
    workspace.desktopsChanged.connect(() => {
        applyGapsAll();
    });
    workspace.screensChanged.connect(() => {
        applyGapsAll();
    });
    workspace.currentActivityChanged.connect(() => {
        applyGapsAll();
    });
    workspace.activitiesChanged.connect(() => {
        applyGapsAll();
    });
    workspace.virtualScreenSizeChanged.connect(() => {
        applyGapsAll();
    });
    workspace.virtualScreenGeometryChanged.connect(() => {
        applyGapsAll();
    });
    workspace.windowAdded.connect((client) => {
        if (client.dock) {
            applyGapsAll();
        }
    });
}

function applyGaps(client) {
    if (block || !client || ignoreClient(client)) return;
    block = true;
    applyGapsArea(client);
    block = false;
}

function applyGapsArea(client) {
    let grid = getGrid(client);
    let win = client.frameGeometry;

    for (let i = 0; i < Object.keys(grid.left).length; i++) {
        let pos = Object.keys(grid.left)[i];
        let coords = grid.left[pos];
        if (nearArea(win.left, coords, config.gapLeft)) {
            let diff = coords.gapped - win.left;
            win.width -= diff;
            win.x += diff;
            break;
        }
    }

    for (let i = 0; i < Object.keys(grid.right).length; i++) {
        let pos = Object.keys(grid.right)[i];
        let coords = grid.right[pos];
        if (nearArea(win.right, coords, config.gapRight)) {
            let diff = win.right - coords.gapped;
            win.width -= diff;
            break;
        }
    }

    for (let i = 0; i < Object.keys(grid.top).length; i++) {
        let pos = Object.keys(grid.top)[i];
        let coords = grid.top[pos];
        if (nearArea(win.top, coords, config.gapTop)) {
            let diff = coords.gapped - win.top;
            win.height -= diff;
            win.y += diff;
            break;
        }
    }

    for (let i = 0; i < Object.keys(grid.bottom).length; i++) {
        let pos = Object.keys(grid.bottom)[i];
        let coords = grid.bottom[pos];
        if (nearArea(win.bottom, coords, config.gapBottom)) {
            let diff = win.bottom - coords.gapped;
            win.height -= diff;
            break;
        }
    }
}

function getArea(client) {
    let clientArea = workspace.clientArea(KWin.MaximizeArea, client);
    return {
        x: clientArea.x + config.offsetLeft,
        y: clientArea.y + config.offsetTop,
        width: clientArea.width - config.offsetLeft - config.offsetRight,
        height: clientArea.height - config.offsetTop - config.offsetBottom,
        left: clientArea.x + config.offsetLeft,
        right: clientArea.x + clientArea.width - config.offsetRight - 1,
        top: clientArea.y + config.offsetTop,
        bottom: clientArea.y + clientArea.height - config.offsetBottom - 1,
    };
}

function getGrid(client) {
    let area = getArea(client);
    return {
        left: {
            fullLeft: {
                closed: Math.round(area.left),
                gapped: Math.round(area.left + config.gapLeft)
            },
            quarterLeft: {
                closed: Math.round(area.left + (area.width / 4)),
                gapped: Math.round(area.left + 1 * (area.width + config.gapLeft - config.gapRight + config.gapMid) / 4)
            },
            halfHorizontal: {
                closed: Math.round(area.left + area.width / 2),
                gapped: Math.round(area.left + (area.width + config.gapLeft - config.gapRight + config.gapMid) / 2)
            },
            quarterRight: {
                closed: Math.round(area.left + 3 * (area.width / 4)),
                gapped: Math.round(area.left + 3 * (area.width + config.gapLeft - config.gapRight + config.gapMid) / 4)
            }
        },
        right: {
            quarterLeft: {
                closed: Math.round(area.right - 3 * (area.width / 4)),
                gapped: Math.round(area.right - 3 * (area.width + config.gapLeft - config.gapRight + config.gapMid) / 4)
            },
            halfHorizontal: {
                closed: Math.round(area.right - area.width / 2),
                gapped: Math.round(area.right - (area.width + config.gapLeft - config.gapRight + config.gapMid) / 2)
            },
            quarterRight: {
                closed: Math.round(area.right - (area.width / 4)),
                gapped: Math.round(area.right - 1 * (area.width + config.gapLeft - config.gapRight + config.gapMid) / 4)
            },
            fullRight: {
                closed: Math.round(area.right),
                gapped: Math.round(area.right - config.gapRight)
            }
        },
        top: {
            fullTop: {
                closed: Math.round(area.top),
                gapped: Math.round(area.top + config.gapTop)
            },
            quarterTop: {
                closed: Math.round(area.top + (area.height / 4)),
                gapped: Math.round(area.top + 1 * (area.height + config.gapTop - config.gapBottom + config.gapMid) / 4)
            },
            halfVertical: {
                closed: Math.round(area.top + area.height / 2),
                gapped: Math.round(area.top + (area.height + config.gapTop - config.gapBottom + config.gapMid) / 2)
            },
            quarterBottom: {
                closed: Math.round(area.top + 3 * (area.height / 4)),
                gapped: Math.round(area.top + 3 * (area.height + config.gapTop - config.gapBottom + config.gapMid) / 4)
            }
        },
        bottom: {
            quarterTop: {
                closed: Math.round(area.bottom - 3 * (area.height / 4)),
                gapped: Math.round(area.bottom - 3 * (area.height + config.gapTop - config.gapBottom + config.gapMid) / 4)
            },
            halfVertical: {
                closed: Math.round(area.bottom - area.height / 2),
                gapped: Math.round(area.bottom - (area.height + config.gapTop - config.gapBottom + config.gapMid) / 2)
            },
            quarterBottom: {
                closed: Math.round(area.bottom - (area.height / 4)),
                gapped: Math.round(area.bottom - 1 * (area.height + config.gapTop - config.gapBottom + config.gapMid) / 4)
            },
            fullBottom: {
                closed: Math.round(area.bottom),
                gapped: Math.round(area.bottom - config.gapBottom)
            }
        }
    };
}

function nearArea(actual, expected, gap) {
    return (Math.abs(actual - expected.closed) <= 2 * gap ||
            Math.abs(actual - expected.gapped) <= 2 * gap) &&
        actual !== expected.gapped;
}

function ignoreClient(client) {
    return !client
        ||
        !(client.normalWindow || ["plasma-interactiveconsole"].includes(String(client.resourceClass)))
        ||
        ["plasmashell", "krunner"].includes(String(client.resourceClass))
        ||
        client.move || client.resize
        ||
        client.fullScreen
        ||
        (client.width !== workspace.clientArea(KWin.MaximizeArea, client).width &&
            client.height !== workspace.clientArea(KWin.MaximizeArea, client).height)
        ||
        (config.excludeMode &&
            config.excludedApps.includes(String(client.resourceClass)))
        ||
        (config.includeMode &&
            !(config.includedApps.includes(String(client.resourceClass))));
}
