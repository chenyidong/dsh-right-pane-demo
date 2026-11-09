# dsh-right-pane-demo

A minimal DSH UI plugin that opens a tab in the app's coloured right sidebar.
It **intercepts clicks on the top-left global panel rows** (owned by any other
plugin) and renders that plugin's real page inside the right sidebar instead of
letting the shell route it into the centre conversation area.

## What it does

- On `document`, in the **capture phase**, it catches clicks on the left
  sidebar's global-panel row buttons. React 18 delegates `onClick` to the root
  container, so a document capture listener runs first: `stopPropagation()`
  cancels the shell's `PanelRow.onClick` → `layout.selectPanel(id)` for every
  panel entry, including entries registered by other plugins.
- The rows are identified by the framework-stable marker
  `[data-slot="sidebar.panellist"]` that `SlotOutlet` renders inside each
  `PanelRow` button (ui-sidebar:229-232 / ui-renderer:1124-1127). It is
  independent of CSS-module hashes, locale labels and build versions; the
  "More" anchor has no outlet and is intentionally left alone.
- It reuses the existing right-pane two-phase protocol
  (`sidebarRightTabs.register` + `sidebar.right.pane.tab` /
  `sidebar.right.pane.tab.title` keyed slots — the same one `dsh-context`
  uses). On click it calls `layout.selectPanel(null)` (so the right sidebar is
  visible again), `layout.openRightbar(true, false)`, then
  `sidebarRight.openTab(kind)`.
- The tab body renders the **real page** of the clicked plugin — not a copy.
  See below.
- Ships zh/en localized copy plus an original icon; no extra launcher button
  is needed — the top-left panel rows are the only entry point.

### How the real page gets into the right pane

`main` is a **keyed root slot** declared by the layout root. Every global panel
is an entry in it (`key: PANEL_ID`), and the same `PANEL_ID` is the `id` of the
left-sidebar `sidebar.panellist` entry (plugin-manager:7753/7823,
schedule:19363/19390). So the body just calls:

```js
renderSlot('main', {}, { entryKey: activeId, fallback })
```

Keyed dispatch then finds the plugin's own main entry and `RootEntry` →
`standardKit` assembles its full kit (`inject`, `store`, `t`, child
`renderSlot` bindings) exactly as it does in the centre column. The centre
keeps showing `conversation` because `activePanelId` stays `null`.

The only obstacle is ownership: `boundRenderSlot` throws
`SlotOwnershipError` unless the calling entry declares the key in its
`children`, while registering `children: { main: ... }` would throw
`slot "main" is already declared (by an entry in "root")` because the layout
root owns it. The fix has two parts:

1. Register the tab body with an empty `children` map so the renderer grants
   it a `renderSlot` face at all.
2. Add `main` to that map as a **non-enumerable** property
   (`Object.defineProperty`). Direct access `entry.children['main']` satisfies
   the ownership check, while `SlotCore`'s `Object.keys(children)` loops —
   used by both the duplicate-declaration guard and `releaseEntry` on unload —
   skip it. The layout-owned `main` slot is therefore never re-declared and
   never wiped when this plugin unloads.

Dispatch itself always uses the global `main` spec (`host.specOf('main')`),
so our declaration only relaxes our own check; it does not shadow anything.

Entries without a matching main page fall back to the entry list, which also
offers "Open in centre" (`layout.selectPanel(id)`) and "Entries" (back).

## Layout

```
dsh-right-pane-demo/
  package.json        # dsh.client -> ./client.js (web), dsh.bundle.patch
  cordis.patch.yml    # inserts the host half into the bundle
  index.js            # host half (plain Cordis plugin, no logic)
  client.js           # browser half: capture interceptor + slot registrations + React body
  icon.svg            # original 64x64 icon
  locale/zh.json      # host-side meta + panel copy
  locale/en.json
  README.md
```

## Install

Repository: https://github.com/chenyidong/dsh-right-pane-demo

From a DSH session, install straight from GitHub:

```
dsh plugin --profile desktop add github:chenyidong/dsh-right-pane-demo
```

Or install the packaged `dsh-right-pane-demo-0.1.0.tgz` from the release page:

```
dsh plugin --profile desktop add <path to dsh-right-pane-demo-0.1.0.tgz>
```

For local development, link this directory into the profile's `node_modules`,
add `"dsh-right-pane-demo": "link:<absolute path>"` to `dependencies` and
append `"dsh-right-pane-demo"` to `dsh.profile.bundles` in
`profiles/desktop/package.json`, then restart DSH (or let profile HMR pick the
manifest change up). The client half is watched by `client-hmr`, so editing
`client.js` hot-reloads in place; reload the Web UI if HMR is unavailable.

Click any plugin icon in the top-left panel column to open the right pane —
that column is the only entry point; there is no extra launcher button.

## License

MIT
