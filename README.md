# dsh-right-pane-demo

A minimal DSH UI plugin that opens tabs in the app's coloured right sidebar.
It **intercepts clicks on the top-left global panel rows** (owned by any other
plugin) and renders that plugin's real page inside the right sidebar instead of
letting the shell route it into the centre conversation area. A settings page
lets you choose **which** plugins are intercepted. Each checked plugin gets its
own button — named and iconed after the plugin itself — in the coloured right
sidebar and in [Better Sidebar](https://github.com/omdsh-dev/DSH-better-sidebar);
clicking that button opens the plugin's real page directly. There is no
aggregate "Panel Entries" launcher and no second click to pick a plugin.

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
- A **settings page** (`settings.section`) lists every detected top-left panel
  entry with a checkbox. Unticked plugins keep the shell's native
  `layout.selectPanel(id)` behaviour; the choice is kept in `localStorage`
  (origin-scoped, the same persistence `dsh-notify-me` uses) and applied to the
  capture listener immediately — no remote read at click time.
- For each **checked** plugin, one tab type is registered in the coloured right
  sidebar (`sidebarRightTabs.register` + `sidebar.right.pane.tab` /
  `sidebar.right.pane.tab.title` keyed slots — the same two-phase protocol
  `dsh-context` uses) using the plugin's own label, real icon and its
  `sidebar.panellist` id as kind. Clicking the left-sidebar row opens that
  exact kind: `layout.selectPanel(null)` (so the right sidebar is visible),
  `layout.openRightbar(true, false)`, then `sidebarRight.openTab(kind)`.
- The same checked plugins are registered into Better Sidebar as one tab each
  (soft dependency via `ctx.get('betterSidebar')` +
  `ctx.on('internal/service', ...)`, the `dsh-mnemon` reconcile pattern). Each
  descriptor sets `bottomOnly: true` so Better Sidebar does **not** mirror it
  into DSH's native right pane — that mirroring is what previously produced two
  "Panel Entries" capsules. Registration is reconciled whenever settings, the
  panel list, or the services change.
- Ships zh/en localised copy plus an original icon; no extra launcher button
  is needed — the top-left panel rows are the only entry point.

### How the real page gets into the right pane

`main` is a **keyed root slot** declared by the layout root. Every global panel
is an entry in it (`key: PANEL_ID`), and the same `PANEL_ID` is the `id` of the
left-sidebar `sidebar.panellist` entry (plugin-manager:7753/7823,
schedule:19363/19390). So the body just calls:

```js
renderSlot('main', {}, { entryKey: id, fallback })
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

The body is a **single** flex column with `min-height:0` and `overflow:auto`
(matching the centre's `mainPanel` shape) instead of nested
`height:100%` + `flex:1` wrappers. That is what restores wheel scrolling:
the old nesting lost its definite height inside the right pane's
`tabBody` container. Entries without a matching main page show a short
"no page" hint rather than a list.

### How the real page reaches Better Sidebar

Better Sidebar mounts its own React root, and its tab `component` receives no
`renderSlot` face — the slot renderer's `HostContext` lives in the main app
tree. So the plugin registers a tiny `shell.overlay` entry (a root list slot
rendered *inside* the main tree, hence with `HostContext` and a
`renderSlot('main', ...)` face) and uses `ReactDOM.createPortal` to project the
real page into a DOM seat that the Better Sidebar tab hands over. This is the
`dsh-mnemon` pattern: "Better Sidebar supplies a DOM seat; the DSH renderer
remains the owner." `createPortal` keeps the parent tree's context, so the
portalled `SlotOutlet` still resolves the global `main` spec and the plugin's
own kit.

Each Better Sidebar tab owns one stable seat node (`flex:1; min-height:0;
overflow:auto`), appended on mount and removed on unmount. The overlay renders
a portal only for seats whose tab is currently mounted, so the same `main`
entry is never mounted twice at once. Both the right-pane bodies and the
overlay declare `main` through the same shared non-enumerable `children` map
described above. Profiles without Better Sidebar simply keep the coloured
right pane.

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

Or install the packaged `dsh-right-pane-demo-0.3.0.tgz` from the release page:

```
dsh plugin --profile desktop add <path to dsh-right-pane-demo-0.3.0.tgz>
```

For local development, link this directory into the profile's `node_modules`,
add `"dsh-right-pane-demo": "link:<absolute path>"` to `dependencies` and
append `"dsh-right-pane-demo"` to `dsh.profile.bundles` in
`profiles/desktop/package.json`, then restart DSH (or let profile HMR pick the
manifest change up). The client half is watched by `client-hmr`, so editing
`client.js` hot-reloads in place; reload the Web UI if HMR is unavailable.

Click any plugin icon in the top-left panel column to open the right pane —
that column is the only entry point; there is no extra launcher button. Open
**Settings → Right Pane Intercept** to choose which plugins are intercepted;
checked plugins appear as their own tabs in the coloured right sidebar and in
Better Sidebar.

## License

MIT
