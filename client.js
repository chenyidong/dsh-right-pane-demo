window.__ModuleLoader__.load({
  id: 'dsh-right-pane-demo',
  factory(require) {
    const React = require('react')

    const NS = 'dsh-right-pane-demo'
    const ID = NS
    const KIND = NS
    const ORDER = 20

    // Same dictionaries as locale/*.json (kept inline: the client half is a
    // standalone browser bundle and cannot read the host's locale files).
    const dict = {
      zh: {
        'panel.tab': '面板入口',
        'panel.guide': '点击左上角任意插件入口，该插件的真实页面会直接显示在右侧有色 sidebar 中。',
        'panel.heading': '被拦截的插件入口',
        'panel.body': '左栏全局面板行的点击已在 document 捕获阶段拦截；右侧栏直接挂载该插件注册在 main 槽里的真实页面，中间会话区保持原样。',
        'panel.empty': '点击左上角任意插件图标试试。',
        'panel.openCenter': '在中心区打开',
        'panel.backToList': '入口列表',
        'panel.noPage': '该入口没有可显示的页面。',
        'panel.hint': '右栏复用 main 槽的 keyed 分发展示插件自身页面；若某个入口没有对应页面，会回退到入口列表。',
      },
      en: {
        'panel.tab': 'Panel Entries',
        'panel.guide': 'Click any plugin entry in the top-left; the real page of that plugin is rendered directly in the coloured right sidebar.',
        'panel.heading': 'Intercepted Plugin Entries',
        'panel.body': 'Clicks on left-sidebar global panel rows are intercepted at the document capture phase; the right pane mounts the real page that the plugin registered in the main slot, while the conversation area stays put.',
        'panel.empty': 'Click any plugin icon in the top-left to try it.',
        'panel.openCenter': 'Open in centre',
        'panel.backToList': 'Entries',
        'panel.noPage': 'No page is available for this entry.',
        'panel.hint': 'The right pane reuses the keyed dispatch of the main slot to show the plugin page itself; entries without a page fall back to the list.',
      },
    }

    // A minimal right-pane icon (left big area + right column), drawn with
    // currentColor so it follows the app's light/dark theme automatically.
    function PanelIcon({ size }) {
      const s = typeof size === 'number' ? size : 18
      return React.createElement('svg', {
        width: s, height: s, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.8,
        strokeLinecap: 'round', strokeLinejoin: 'round',
      },
        React.createElement('rect', { x: 2, y: 3, width: 20, height: 18, rx: 2 }),
        React.createElement('line', { x1: 14, y1: 3, x2: 14, y2: 21 }),
        React.createElement('line', { x1: 6, y1: 8, x2: 10, y2: 8 }),
        React.createElement('line', { x1: 6, y1: 12, x2: 10, y2: 12 }),
      )
    }

    // Other plugins' panel icons may expect props we cannot supply; keep one
    // bad icon from blanking the whole tab (the renderer only guards our body).
    class SafeIcon extends React.Component {
      constructor(props) { super(props); this.state = { bad: false } }
      static getDerivedStateFromError() { return { bad: true } }
      render() {
        return this.state.bad
          ? React.createElement(PanelIcon, { size: 18 })
          : React.createElement(this.props.comp, { size: 18 })
      }
    }

    function makeTitle(t) {
      return function TabTitle() {
        return React.createElement(React.Fragment, null,
          React.createElement(PanelIcon, { size: 16 }),
          React.createElement('span', { style: { marginLeft: 6 } }, t('panel.tab')),
        )
      }
    }

    const rowStyle = {
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 10px', borderRadius: 8,
      border: '1px solid transparent',
    }
    const linkStyle = {
      padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
      background: 'transparent', color: 'inherit',
      fontFamily: 'inherit', fontSize: 12,
      border: '1px solid currentColor',
    }
    const labelButtonStyle = {
      flex: 1, textAlign: 'left', fontSize: 13, padding: 0,
      color: 'inherit', fontFamily: 'inherit',
      background: 'transparent', border: 0, cursor: 'pointer',
    }

    // Registered into sidebar.right.pane.tab, so the renderer hands the body a
    // renderSlot face. renderSlot('main', ..., {entryKey: id}) mounts the REAL
    // global panel page: keyed dispatch finds the plugin's own main entry and
    // standardKit assembles its full kit (inject, store, t, child renderSlot).
    // Nothing is copied or reimplemented here.
    function makeBody(ctx, t, store) {
      return function PanelBody(props) {
        const { panels, activeId } = React.useSyncExternalStore(store.subscribe, store.getSnapshot)
        const renderSlot = props.renderSlot
        const openCenter = (id) => {
          const layout = ctx.get('layout')
          if (layout && typeof layout.selectPanel === 'function') {
            try { layout.selectPanel(id) } catch (err) { console.error(NS + ': selectPanel failed', err) }
          }
        }
        const select = (id) => store.set({ panels, activeId: id })
        const active = panels.find((p) => p.id === activeId)
        let page = null
        if (activeId && renderSlot) {
          try {
            page = renderSlot('main', {}, {
              entryKey: activeId,
              fallback: React.createElement('p', { style: { margin: 0, opacity: 0.6, fontSize: 12 } }, t('panel.noPage')),
            })
          } catch (err) { console.error(NS + ': main render failed', err) }
        }
        return React.createElement('div', {
          style: {
            height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column',
            color: 'inherit', fontFamily: 'inherit', lineHeight: 1.6,
          },
        },
          React.createElement('div', {
            style: {
              display: 'flex', alignItems: 'center', gap: 8, flex: 'none',
              padding: '10px 12px', borderBottom: '1px solid currentColor',
            },
          },
            React.createElement(PanelIcon, { size: 16 }),
            React.createElement('span', { style: { flex: 1, fontSize: 13, fontWeight: 600 } }, active ? active.label : t('panel.heading')),
            active ? React.createElement('button', { type: 'button', style: linkStyle, onClick: () => select(null) }, t('panel.backToList')) : null,
            active ? React.createElement('button', { type: 'button', style: linkStyle, onClick: () => openCenter(activeId) }, t('panel.openCenter')) : null,
          ),
          page
            ? React.createElement('div', { style: { flex: 1, minHeight: 0, overflow: 'auto' } }, page)
            : React.createElement('div', {
                style: { padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' },
              },
                React.createElement('p', { style: { margin: 0, opacity: 0.85, fontSize: 13 } }, t('panel.body')),
                panels.length === 0
                  ? React.createElement('p', { style: { margin: 0, opacity: 0.6, fontSize: 12 } }, t('panel.empty'))
                  : panels.map((p) => React.createElement('div', {
                      key: p.id,
                      style: {
                        ...rowStyle,
                        borderColor: p.id === activeId ? 'currentColor' : 'transparent',
                        background: p.id === activeId ? 'rgba(128,128,128,0.12)' : 'transparent',
                      },
                    },
                      p.Icon ? React.createElement(SafeIcon, { comp: p.Icon }) : React.createElement(PanelIcon, { size: 18 }),
                      React.createElement('button', { type: 'button', style: labelButtonStyle, onClick: () => select(p.id) }, p.label),
                      React.createElement('code', { style: { opacity: 0.5, fontSize: 11 } }, p.id),
                      React.createElement('button', { type: 'button', style: linkStyle, onClick: () => openCenter(p.id) }, t('panel.openCenter')),
                    )),
                React.createElement('p', { style: { margin: 0, opacity: 0.6, fontSize: 12 } }, t('panel.hint')),
              ),
        )
      }
    }

    // Collect the left-sidebar panel rows (owned by any plugin), publish them
    // for the right tab, reset a previously selected global panel so the right
    // sidebar is visible, then open/reveal our tab.
    function showPane(ctx, store, label) {
      const slots = ctx.get('slots')
      const layout = ctx.get('layout')
      let panels = []
      try {
        panels = (slots.entriesOfSlot('sidebar.panellist') || []).map((entry) => {
          let value
          try {
            const raw = entry.options.label
            value = typeof raw === 'function' ? raw() : raw
          } catch (_) {}
          return {
            id: String(entry.options.id),
            label: value || String(entry.options.id),
            Icon: entry.component,
          }
        })
      } catch (err) { console.error(NS + ': panel lookup failed', err) }
      const hit = panels.find((p) => p.label === label)
      store.set({ panels, activeId: hit ? hit.id : null })

      // A global panel selected earlier hides the right sidebar
      // (activePanelId !== null); return to the conversation before revealing.
      try {
        const info = layout && layout.panelInfo && layout.panelInfo.getSnapshot && layout.panelInfo.getSnapshot()
        if (info && info.activePanelId !== null && typeof layout.selectPanel === 'function') layout.selectPanel(null)
      } catch (_) {}

      if (layout && typeof layout.openRightbar === 'function') {
        try { layout.openRightbar(true, false) } catch (err) { console.error(NS + ': openRightbar failed', err) }
      }
      const sidebarRight = ctx.get('sidebarRight')
      if (sidebarRight && typeof sidebarRight.openTab === 'function') {
        try { sidebarRight.openTab(KIND) } catch (err) { console.error(NS + ': openTab failed', err) }
      }
    }

    // React 18 delegates onClick to the root container. A document-level
    // capture listener runs before that delegation, so stopPropagation here
    // cancels the shell's selectPanel(id) for every left-sidebar panel row,
    // including rows owned by other plugins. No shell edit, no service swap.
    function installInterceptor(ctx, store) {
      const handler = (e) => {
        const el = e.target
        const btn = el && el.closest ? el.closest('button') : null
        // SlotOutlet renders <div data-slot="sidebar.panellist"> inside each
        // PanelRow button (ui-sidebar:229-232). The More anchor has no outlet,
        // so this marker identifies exactly the global-panel rows, independent
        // of CSS-module hashes, locale labels and build versions.
        if (!btn || !btn.querySelector('[data-slot="sidebar.panellist"]')) return
        e.preventDefault()
        e.stopPropagation()
        showPane(ctx, store, btn.getAttribute('aria-label'))
      }
      document.addEventListener('click', handler, true)
      return () => document.removeEventListener('click', handler, true)
    }

    // dsh-context's Yp(): wait for sidebarRightTabs, then register the tab
    // type + its body/title keyed slots. Returns a cleanup function.
    // main is already declared by the layout root, so declaring it in the
    // registration options would throw "slot main is already declared". The
    // renderer only grants renderSlot to entries with a children map and gates
    // each call on entry.children[key]; a non-enumerable `main` satisfies that
    // gate while SlotCore's Object.keys(children) loops (register/unload) skip
    // it, so the layout-owned slot is never re-declared or wiped on unload.
    // Dispatch still uses the global main spec, which mounts the plugin's own
    // main entry with its full kit through RootEntry.
    function registerRightPane(ctx, body, title, t) {
      const slots = ctx.get('slots')
      const handle = ctx.inject(['sidebarRightTabs'], (scope) => {
        const tabs = scope.sidebarRightTabs
        if (!tabs || typeof tabs.register !== 'function' || !slots || typeof slots.inject !== 'function') return
        const dispose = []
        const children = {}
        Object.defineProperty(children, 'main', {
          value: { kind: 'keyed', scope: 'root' }, enumerable: false,
        })
        try {
          dispose.push(tabs.register({
            id: ID,
            kind: KIND,
            priority: 'extension',
            title: () => t('panel.tab'),
            guide: [{ order: ORDER, title: () => t('panel.tab'), description: () => t('panel.guide'), icon: PanelIcon }],
          }))
          dispose.push(slots.inject('sidebar.right.pane.tab', () =>
            slots.register({ name: 'sidebar.right.pane.tab', key: ID, locale: NS, children }, body)))
          dispose.push(slots.inject('sidebar.right.pane.tab.title', () =>
            slots.register({ name: 'sidebar.right.pane.tab.title', key: ID }, title)))
        } catch (err) {
          for (const d of dispose) { try { d && d() } catch (_) {} }
          return
        }
        return () => { for (const d of dispose) { try { d && d() } catch (_) {} } }
      })
      return () => { try { handle && handle.dispose && handle.dispose() } catch (_) {} }
    }

    return {
      name: NS,
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh: dict.zh, en: dict.en }), NS + ': dictionaries')
        const t = ctx.locale.bind(NS)

        // Minimal external store: useSyncExternalStore needs a stable snapshot.
        let snapshot = { panels: [], activeId: null }
        const listeners = new Set()
        const store = {
          getSnapshot: () => snapshot,
          subscribe: (fn) => { listeners.add(fn); return () => { listeners.delete(fn) } },
          set: (next) => { snapshot = next; for (const fn of listeners) fn() },
        }

        const body = makeBody(ctx, t, store)
        const title = makeTitle(t)

        ctx.effect(() => {
          const stopIntercept = installInterceptor(ctx, store)
          const stopRight = registerRightPane(ctx, body, title, t)
          return () => { stopIntercept(); stopRight() }
        }, NS + ': placement')
      },
    }
  },
})
