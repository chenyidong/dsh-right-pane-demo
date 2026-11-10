window.__ModuleLoader__.load({
  id: 'dsh-right-pane-demo',
  factory(require) {
    const React = require('react')
    const ReactDOM = require('react-dom')

    const NS = 'dsh-right-pane-demo'
    const LS_KEY = NS + ':excluded'
    const tabId = (id) => NS + ':' + id
    const bsId = (id) => NS + ':bs:' + id

    const dict = {
      zh: {
        'panel.noPage': '该插件没有可显示的页面。',
        'panel.inBetter': '该插件正在 Better Sidebar 中显示。',
        'settings.nav': '右栏面板拦截',
        'settings.title': '选择启用拦截的插件',
        'settings.hint': '勾选的插件会在右侧有色 sidebar 与 Better Sidebar 中各生成一个以插件自身图标和名称命名的按钮，点击直接打开该插件页面；未勾选的插件保持系统默认的中心区打开方式。选择保存在本浏览器（localStorage）。',
        'settings.empty': '没有检测到左上角面板入口。',
        'settings.close': '完成',
      },
      en: {
        'panel.noPage': 'This plugin has no page to show.',
        'panel.inBetter': 'This plugin is currently shown in Better Sidebar.',
        'settings.nav': 'Right Pane Intercept',
        'settings.title': 'Choose which plugins to intercept',
        'settings.hint': 'Checked plugins get a button named and iconed after the plugin itself in the coloured right sidebar and in Better Sidebar; clicking opens the plugin page directly. Unchecked plugins keep the default centre-area behaviour. Choices are stored in this browser (localStorage).',
        'settings.empty': 'No top-left panel entries were detected.',
        'settings.close': 'Done',
      },
    }

    function PanelIcon({ size }) {
      const s = typeof size === 'number' ? size : 18
      return React.createElement('svg', {
        width: s, height: s, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
      },
        React.createElement('rect', { x: 2, y: 3, width: 20, height: 18, rx: 2 }),
        React.createElement('line', { x1: 14, y1: 3, x2: 14, y2: 21 }),
        React.createElement('line', { x1: 6, y1: 8, x2: 10, y2: 8 }),
        React.createElement('line', { x1: 6, y1: 12, x2: 10, y2: 12 }),
      )
    }

    class SafeIcon extends React.Component {
      constructor(props) { super(props); this.state = { bad: false } }
      static getDerivedStateFromError() { return { bad: true } }
      render() {
        return this.state.bad
          ? React.createElement(PanelIcon, { size: 18 })
          : React.createElement(this.props.comp, { size: this.props.size || 18 })
      }
    }

    const css = [
      '.' + NS + '-btn{display:inline-flex;align-items:center;justify-content:center;flex:none;',
      '  padding:4px 10px;border-radius:7px;cursor:pointer;color:inherit;',
      '  font-family:inherit;font-size:12px;line-height:1.4;',
      '  background:rgba(128,128,128,.10);border:1px solid rgba(128,128,128,.26);',
      '  transition:background .15s,border-color .15s;}',
      '.' + NS + '-btn:hover{background:rgba(128,128,128,.20);border-color:rgba(128,128,128,.45);}',
      '.' + NS + '-btn:active{background:rgba(128,128,128,.28);}',
      '.' + NS + '-btn:focus-visible{outline:2px solid rgba(128,128,128,.55);outline-offset:1px;}',
      '.' + NS + '-btn-primary{background:rgba(128,128,128,.20);border-color:rgba(128,128,128,.42);}',
      '.' + NS + '-btn-primary:hover{background:rgba(128,128,128,.30);border-color:rgba(128,128,128,.58);}',
      '.' + NS + '-glyph{flex:none;display:inline-flex;align-items:center;justify-content:center;',
      '  width:28px;height:28px;border-radius:8px;background:rgba(128,128,128,.12);}',
      '.' + NS + '-id{flex:none;max-width:120px;font-size:11px;opacity:.55;padding:2px 6px;border-radius:5px;',
      '  background:rgba(128,128,128,.10);font-family:ui-monospace,Menlo,Consolas,monospace;',
      '  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.' + NS + '-list{border:1px solid rgba(128,128,128,.18);border-radius:9px;overflow:hidden;}',
      '.' + NS + '-opt{display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;',
      '  border-bottom:1px solid rgba(128,128,128,.14);transition:background .15s;}',
      '.' + NS + '-opt:last-child{border-bottom:0;}',
      '.' + NS + '-opt:hover{background:rgba(128,128,128,.10);}',
      '.' + NS + '-opt input{margin:0;flex:none;cursor:pointer;}',
    ].join('\n')

    const btn = (text, onClick, extra) => React.createElement('button', {
      type: 'button', className: NS + '-btn' + (extra ? ' ' + NS + '-btn-' + extra : ''), onClick,
    }, text)

    // main is a keyed root slot owned by the layout root. Declaring it here
    // (non-enumerably) lets our entries call renderSlot('main', ...) without
    // re-declaring the layout-owned slot.
    const mainChildren = {}
    Object.defineProperty(mainChildren, 'main', {
      value: { kind: 'keyed', scope: 'root' }, enumerable: false,
    })

    function readPanels(ctx) {
      const slots = ctx.get('slots')
      try {
        return (slots.entriesOfSlot('sidebar.panellist') || []).map((entry) => {
          let value
          try {
            const raw = entry.options.label
            value = typeof raw === 'function' ? raw() : raw
          } catch (_) {}
          return { id: String(entry.options.id), label: value || String(entry.options.id), Icon: entry.component }
        })
      } catch (err) { console.error(NS + ': panel lookup failed', err); return [] }
    }

    function readExcluded() {
      try {
        const raw = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
        return Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : []
      } catch (_) { return [] }
    }

    function mainPage(renderSlot, id, t) {
      if (!renderSlot) return null
      try {
        return renderSlot('main', {}, {
          entryKey: id,
          fallback: React.createElement('p', { style: { margin: 0, padding: 16, opacity: 0.6, fontSize: 12 } }, t('panel.noPage')),
        })
      } catch (err) { console.error(NS + ': main render failed', err); return null }
    }

    // One scroll container per Better Sidebar tab. The seat itself is the
    // flex column the plugin page expects (the centre uses the same shape),
    // with overflow:auto as a fallback so a page that does not scroll itself
    // is still scrollable. No nested height:100% wrappers.
    const makeSeat = () => {
      const d = document.createElement('div')
      d.style.cssText = 'flex:1;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:auto;box-sizing:border-box;'
      return d
    }

    function makeTitle(p) {
      return function PaneTitle() {
        return React.createElement(React.Fragment, null,
          React.createElement('span', {
            style: { display: 'inline-flex', width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
          }, p.Icon ? React.createElement(SafeIcon, { comp: p.Icon, size: 14 }) : React.createElement(PanelIcon, { size: 14 })),
          React.createElement('span', { style: { marginLeft: 8, fontSize: 13 } }, p.label))
      }
    }

    // One scroll container only: the old nested height:100% + flex:1 wrappers
    // lost their definite height and swallowed wheel scrolling.
    function makeBody(ctx, t, store, id) {
      return function PaneBody(props) {
        const { owner } = React.useSyncExternalStore(store.subscribe, store.getSnapshot)
        return React.createElement('div', {
          style: {
            height: '100%', maxHeight: '100%', minHeight: 0, minWidth: 0,
            display: 'flex', flexDirection: 'column', overflow: 'auto',
            boxSizing: 'border-box', WebkitOverflowScrolling: 'touch',
          },
        },
          owner[id] === 'better'
            ? React.createElement('p', { style: { margin: 0, padding: 16, opacity: 0.6, fontSize: 12 } }, t('panel.inBetter'))
            : mainPage(props.renderSlot, id, t))
      }
    }

    // shell.overlay is a root list slot rendered inside the main React tree,
    // so this entry has HostContext and a renderSlot face. createPortal keeps
    // that context while putting the real page into a Better Sidebar seat.
    function makeOverlay(store, t, seats) {
      return function PaneOverlay(props) {
        const { owner } = React.useSyncExternalStore(store.subscribe, store.getSnapshot)
        return React.createElement(React.Fragment, null, Object.keys(owner).filter((id) => owner[id] === 'better').map((id) => {
          const seat = seats[id]
          if (!seat) return null
          const page = mainPage(props.renderSlot, id, t)
          return page ? React.createElement(React.Fragment, { key: id }, ReactDOM.createPortal(page, seat)) : null
        }))
      }
    }

    // bottomOnly keeps Better Sidebar from mirroring this descriptor into DSH's
    // native right pane, so each plugin has exactly one tab per surface.
    function makeBetterTab(ctx, t, store, seats, id) {
      return function BetterPaneTab(props) {
        const holder = React.useRef(null)
        React.useLayoutEffect(() => {
          if (props.visible === false) return
          const node = holder.current
          if (!node) return
          const seat = seats[id] || (seats[id] = makeSeat())
          if (seat.parentNode !== node) node.appendChild(seat)
          store.claim(id, 'better')
          return () => {
            store.release(id, 'better')
            if (seat.parentNode === node) node.removeChild(seat)
          }
        }, [props.visible])
        return React.createElement('div', {
          ref: holder,
          style: { height: '100%', minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        })
      }
    }

    function installInterceptor(ctx, store) {
      const handler = (e) => {
        const el = e.target
        const row = el && el.closest ? el.closest('button') : null
        if (!row || !row.querySelector('[data-slot="sidebar.panellist"]')) return
        const label = row.getAttribute('aria-label')
        const hit = readPanels(ctx).find((p) => p.label === label)
        if (!hit || store.getSnapshot().excluded.indexOf(hit.id) !== -1) return
        e.preventDefault()
        e.stopPropagation()
        store.claim(hit.id, 'right')
        const layout = ctx.get('layout')
        try {
          const info = layout && layout.panelInfo && layout.panelInfo.getSnapshot && layout.panelInfo.getSnapshot()
          if (info && info.activePanelId !== null && layout.selectPanel) layout.selectPanel(null)
        } catch (_) {}
        if (layout && layout.openRightbar) {
          try { layout.openRightbar(true, false) } catch (err) { console.error(NS + ': openRightbar failed', err) }
        }
        const right = ctx.get('sidebarRight')
        if (right && right.openTab) {
          try { right.openTab(tabId(hit.id)) } catch (err) { console.error(NS + ': openTab failed', err) }
        }
      }
      document.addEventListener('click', handler, true)
      return () => document.removeEventListener('click', handler, true)
    }

    // One tab kind per enabled plugin, in both surfaces. Reconcile on settings
    // changes, panel-list changes and service (re)appearance.
    function registerSurfaces(ctx, t, store, seats) {
      const slots = ctx.get('slots')
      const liveRight = {}
      const liveBetter = {}
      let tabsService = null
      let betterService = null
      const disposeAll = (list) => { for (const d of list) { try { d && d() } catch (_) {} } }

      const rightOne = (p) => {
        const key = tabId(p.id)
        const icon = p.Icon
          ? (props) => React.createElement(SafeIcon, { comp: p.Icon, size: (props && props.size) || 16 })
          : undefined
        const ds = []
        ds.push(tabsService.register({
          id: key, kind: key, priority: 'extension', title: () => p.label,
          guide: [{ id: p.id, order: 20, title: () => p.label, ...(icon ? { icon } : {}) }],
        }))
        ds.push(slots.inject('sidebar.right.pane.tab', () =>
          slots.register({ name: 'sidebar.right.pane.tab', key, children: mainChildren }, makeBody(ctx, t, store, p.id))))
        ds.push(slots.inject('sidebar.right.pane.tab.title', () =>
          slots.register({ name: 'sidebar.right.pane.tab.title', key }, makeTitle(p))))
        return ds
      }

      const betterOne = (service, p) => service.registerTab({
        id: bsId(p.id),
        title: () => p.label,
        icon: (size) => p.Icon ? React.createElement(SafeIcon, { comp: p.Icon, size }) : React.createElement(PanelIcon, { size }),
        order: 50,
        single: true,
        bottomOnly: true,
        component: makeBetterTab(ctx, t, store, seats, p.id),
      })

      const sync = () => {
        const excluded = store.getSnapshot().excluded
        const enabled = readPanels(ctx).filter((p) => excluded.indexOf(p.id) === -1)
        const want = {}
        for (const p of enabled) want[p.id] = p

        if (tabsService) {
          for (const id of Object.keys(liveRight)) if (!want[id]) { disposeAll(liveRight[id]); delete liveRight[id] }
          for (const id of Object.keys(want)) if (!liveRight[id]) {
            try { liveRight[id] = rightOne(want[id]) } catch (err) { console.error(NS + ': right tab failed', err) }
          }
        }

        const svc = ctx.get('betterSidebar')
        if (svc !== betterService) {
          for (const id of Object.keys(liveBetter)) { try { liveBetter[id] && liveBetter[id]() } catch (_) {} delete liveBetter[id] }
          betterService = svc
        }
        if (betterService && typeof betterService.registerTab === 'function') {
          for (const id of Object.keys(liveBetter)) if (!want[id]) { try { liveBetter[id] && liveBetter[id]() } catch (_) {} delete liveBetter[id] }
          for (const id of Object.keys(want)) if (!liveBetter[id]) {
            try { liveBetter[id] = betterOne(betterService, want[id]) } catch (err) { console.error(NS + ': betterSidebar registerTab failed', err) }
          }
        }
      }

      const handle = ctx.inject(['sidebarRightTabs'], (scope) => {
        tabsService = scope.sidebarRightTabs
        sync()
      })
      const offs = [store.subscribe(sync)]
      try { offs.push(slots.subscribe('sidebar.panellist', sync)) } catch (_) {}
      offs.push(ctx.on('internal/service', (name) => {
        if (name === 'sidebarRightTabs' || name === 'betterSidebar') sync()
      }))
      sync()
      return () => {
        for (const off of offs) { try { off && off() } catch (_) {} }
        if (handle && handle.dispose) { try { handle.dispose() } catch (_) {} }
        for (const id of Object.keys(liveRight)) disposeAll(liveRight[id])
        for (const id of Object.keys(liveBetter)) { try { liveBetter[id] && liveBetter[id]() } catch (_) {} }
      }
    }

    function makeSettings(ctx, t, store) {
      return function SettingsSection(props) {
        const { excluded } = React.useSyncExternalStore(store.subscribe, store.getSnapshot)
        const [panels, setPanels] = React.useState(() => readPanels(ctx))
        React.useEffect(() => {
          const slots = ctx.get('slots')
          return slots && slots.subscribe ? slots.subscribe('sidebar.panellist', () => setPanels(readPanels(ctx))) : undefined
        }, [])
        const toggle = (id, checked) => {
          const next = checked
            ? excluded.filter((x) => x !== id)
            : (excluded.indexOf(id) === -1 ? excluded.concat(id) : excluded)
          try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch (_) {}
          store.patch({ excluded: next })
        }
        return React.createElement('div', {
          style: { padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, color: 'inherit', fontFamily: 'inherit', lineHeight: 1.6, maxWidth: 640 },
        },
          React.createElement('style', null, css),
          React.createElement('h3', { style: { margin: 0, fontSize: 15 } }, t('settings.title')),
          React.createElement('p', { style: { margin: 0, opacity: 0.8, fontSize: 13 } }, t('settings.hint')),
          panels.length === 0
            ? React.createElement('p', { style: { margin: 0, opacity: 0.6, fontSize: 12 } }, t('settings.empty'))
            : React.createElement('div', { className: NS + '-list' }, panels.map((p) =>
                React.createElement('label', { key: p.id, className: NS + '-opt' },
                  React.createElement('input', {
                    type: 'checkbox', checked: excluded.indexOf(p.id) === -1,
                    onChange: (e) => toggle(p.id, e.target.checked),
                  }),
                  React.createElement('span', { className: NS + '-glyph' }, p.Icon ? React.createElement(SafeIcon, { comp: p.Icon }) : React.createElement(PanelIcon, { size: 18 })),
                  React.createElement('span', { style: { flex: 1, minWidth: 0, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, title: p.label }, p.label),
                  React.createElement('code', { className: NS + '-id', title: p.id }, p.id),
                ))),
          React.createElement('div', null, btn(t('settings.close'), () => props.close && props.close(), 'primary')),
        )
      }
    }

    function registerSettings(ctx, t, settings) {
      const slots = ctx.get('slots')
      try {
        return slots.inject('settings.section', () =>
          slots.register({ name: 'settings.section', id: NS, order: 90, label: () => t('settings.nav'), locale: NS }, settings))
      } catch (err) { console.error(NS + ': settings slot failed', err); return () => {} }
    }

    function registerOverlay(ctx, overlay) {
      const slots = ctx.get('slots')
      try {
        return slots.inject('shell.overlay', () =>
          slots.register({ name: 'shell.overlay', id: NS, order: 100, children: mainChildren }, overlay))
      } catch (err) { console.error(NS + ': overlay slot failed', err); return () => {} }
    }

    return {
      name: NS,
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh: dict.zh, en: dict.en }), NS + ': dictionaries')
        const t = ctx.locale.bind(NS)

        // owner[id] = 'right' | 'better': exactly one surface owns the real
        // main page at a time, so the same keyed entry is never mounted twice.
        let snapshot = { excluded: readExcluded(), owner: {} }
        const listeners = new Set()
        const notify = () => { for (const fn of listeners) fn() }
        const store = {
          getSnapshot: () => snapshot,
          subscribe: (fn) => { listeners.add(fn); return () => { listeners.delete(fn) } },
          patch: (next) => { snapshot = { ...snapshot, ...next }; notify() },
          claim: (id, surface) => {
            if (snapshot.owner[id] === surface) return
            snapshot = { ...snapshot, owner: { ...snapshot.owner, [id]: surface } }
            notify()
          },
          release: (id, surface) => {
            if (snapshot.owner[id] !== surface) return
            const owner = { ...snapshot.owner }
            delete owner[id]
            snapshot = { ...snapshot, owner }
            notify()
          },
        }

        const seats = {}
        const settings = makeSettings(ctx, t, store)
        const overlay = makeOverlay(store, t, seats)

        ctx.effect(() => {
          const stops = [
            installInterceptor(ctx, store),
            registerSurfaces(ctx, t, store, seats),
            registerOverlay(ctx, overlay),
            registerSettings(ctx, t, settings),
          ]
          return () => { for (const stop of stops) { try { stop && stop() } catch (_) {} } }
        }, NS + ': placement')
      },
    }
  },
})
