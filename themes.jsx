/* Stepguard — Theme tweaks (React + tweaks-panel.jsx) */
/* global React, ReactDOM, useTweaks, TweaksPanel, TweakSection */

const THEMES = {
  midnight: {
    label: 'Midnight Steel',
    subtitle: 'Navy · cyan',
    swatch: ['#04070c', '#1FA9F5', '#5BD0FF'],
    vars: {
      '--bg': '#04070c',
      '--bg-2': '#070b12',
      '--surface': '#0b1119',
      '--surface-2': '#0f1722',
      '--line': 'rgba(255,255,255,.07)',
      '--line-strong': 'rgba(255,255,255,.14)',
      '--text': '#E8EEF5',
      '--muted': '#8493A8',
      '--dim': '#5A6776',
      '--steel': '#BCC8D6',
      '--accent': '#1FA9F5',
      '--accent-2': '#5BD0FF',
      '--accent-deep': '#0a4d77',
      '--laser': '#FF2A2A',
      '--laser-glow': 'rgba(255,42,42,.6)',
      '--ok': '#38D38A',
      '--warn': '#F5C24D',
      '--hot': '#FF6A3D',
    },
  },
  amber: {
    label: 'Amber Foundry',
    subtitle: 'Warm dark · amber',
    swatch: ['#0d0907', '#F59E0B', '#FCD34D'],
    vars: {
      '--bg': '#0d0907',
      '--bg-2': '#14100c',
      '--surface': '#1a1410',
      '--surface-2': '#221a14',
      '--line': 'rgba(255,230,200,.07)',
      '--line-strong': 'rgba(255,230,200,.14)',
      '--text': '#F3EDE5',
      '--muted': '#A89C8A',
      '--dim': '#6E6354',
      '--steel': '#D4C8B6',
      '--accent': '#F59E0B',
      '--accent-2': '#FCD34D',
      '--accent-deep': '#783F0B',
      '--laser': '#FF3838',
      '--laser-glow': 'rgba(255,56,56,.6)',
      '--ok': '#84CC16',
      '--warn': '#F5C24D',
      '--hot': '#FB7185',
    },
  },
  forest: {
    label: 'Forest Signal',
    subtitle: 'Deep green · mint',
    swatch: ['#04100c', '#14B886', '#4ADE80'],
    vars: {
      '--bg': '#04100c',
      '--bg-2': '#061814',
      '--surface': '#0a1f1a',
      '--surface-2': '#102b24',
      '--line': 'rgba(180,240,210,.07)',
      '--line-strong': 'rgba(180,240,210,.14)',
      '--text': '#E5F2EC',
      '--muted': '#7E9B91',
      '--dim': '#4F6A60',
      '--steel': '#B8D4C6',
      '--accent': '#14B886',
      '--accent-2': '#4ADE80',
      '--accent-deep': '#0a5840',
      '--laser': '#FB3A3A',
      '--laser-glow': 'rgba(251,58,58,.6)',
      '--ok': '#38D38A',
      '--warn': '#F5C24D',
      '--hot': '#FF6A3D',
    },
  },
  crimson: {
    label: 'Crimson Mono',
    subtitle: 'Near-black · single red',
    swatch: ['#0a0a0a', '#DC2626', '#F87171'],
    vars: {
      '--bg': '#0a0a0a',
      '--bg-2': '#111111',
      '--surface': '#161616',
      '--surface-2': '#1c1c1c',
      '--line': 'rgba(255,255,255,.06)',
      '--line-strong': 'rgba(255,255,255,.12)',
      '--text': '#EDEDED',
      '--muted': '#888888',
      '--dim': '#555555',
      '--steel': '#C0C0C0',
      '--accent': '#DC2626',
      '--accent-2': '#F87171',
      '--accent-deep': '#6B0F0F',
      '--laser': '#DC2626',
      '--laser-glow': 'rgba(220,38,38,.6)',
      '--ok': '#A3A3A3',
      '--warn': '#D4D4D4',
      '--hot': '#F87171',
    },
  },
  plum: {
    label: 'Royal Plum',
    subtitle: 'Deep purple · violet',
    swatch: ['#08050f', '#8B5CF6', '#C4B5FD'],
    vars: {
      '--bg': '#08050f',
      '--bg-2': '#0e0a16',
      '--surface': '#14101e',
      '--surface-2': '#1c1730',
      '--line': 'rgba(220,210,255,.07)',
      '--line-strong': 'rgba(220,210,255,.14)',
      '--text': '#ECE8F5',
      '--muted': '#9489A8',
      '--dim': '#5F557A',
      '--steel': '#C8BDD6',
      '--accent': '#8B5CF6',
      '--accent-2': '#C4B5FD',
      '--accent-deep': '#4C1D95',
      '--laser': '#FF2A6A',
      '--laser-glow': 'rgba(255,42,106,.6)',
      '--ok': '#34D399',
      '--warn': '#FBBF24',
      '--hot': '#F472B6',
    },
  },
  paper: {
    label: 'Stepguard Classic',
    subtitle: 'White · orange · navy',
    swatch: ['#ffffff', '#e0521f', '#16202c'],
    vars: {
      '--bg': '#ffffff',
      '--bg-2': '#f6f6f4',
      '--surface': '#ffffff',
      '--surface-2': '#f6f6f4',
      '--line': '#e6e6e3',
      '--line-strong': '#cfcfca',
      '--text': '#15202e',
      '--muted': '#677687',
      '--dim': '#9aa6b2',
      '--steel': '#3b4654',
      '--accent': '#e0521f',
      '--accent-2': '#cf4a1c',
      '--accent-deep': '#16202c',
      '--word-grey': '#8c949e',
      '--laser': '#d63f2b',
      '--laser-glow': 'rgba(214,63,43,.45)',
      '--ok': '#1b8f4a',
      '--warn': '#e0992a',
      '--hot': '#d63f2b',
    },
  },
};

window.SG_THEMES = THEMES;

window.sgApplyTheme = function applyTheme(key) {
  const t = THEMES[key] || THEMES.midnight;
  const root = document.documentElement;
  Object.entries(t.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.dataset.theme = key;
};

function textOn(bg) {
  const hex = bg.replace('#', '');
  if (hex.length < 6) return '#fff';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#14181D' : '#F3F5F9';
}
function mutedOn(bg) {
  return textOn(bg) === '#14181D' ? '#5A6776' : '#9AA6B5';
}

const themePickerStyles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
  },
  card: {
    cursor: 'pointer',
    borderRadius: 12,
    padding: '12px 12px 14px',
    textAlign: 'left',
    transition: 'transform .15s, box-shadow .15s, border-color .15s',
    fontFamily: 'inherit',
    color: 'inherit',
  },
  swatchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    position: 'relative',
  },
  swatchDot: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    display: 'inline-block',
  },
  checkBadge: {
    marginLeft: 'auto',
    fontSize: 10,
    letterSpacing: '.1em',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '-.01em',
  },
  cardSub: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.85,
  },
};

function ThemePicker() {
  const defaults = window.__SG_TWEAK_DEFAULTS || { theme: 'midnight' };
  const [t, setTweak] = useTweaks(defaults);

  React.useEffect(() => {
    window.sgApplyTheme(t.theme);
    try { localStorage.setItem('sg_theme', t.theme); } catch (_) {}
  }, [t.theme]);

  const keys = Object.keys(THEMES);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme">
        <div style={themePickerStyles.grid}>
          {keys.map((k) => {
            const th = THEMES[k];
            const active = t.theme === k;
            const accent = th.swatch[1];
            return (
              <button
                key={k}
                type="button"
                onClick={() => setTweak('theme', k)}
                style={{
                  ...themePickerStyles.card,
                  border: '1px solid ' + (active ? accent : 'rgba(255,255,255,0.12)'),
                  boxShadow: active
                    ? '0 0 0 1px ' + accent + ', 0 8px 22px rgba(0,0,0,.35)'
                    : '0 4px 12px rgba(0,0,0,.25)',
                  background: th.swatch[0],
                }}
              >
                <div style={themePickerStyles.swatchRow}>
                  {th.swatch.map((c, i) => (
                    <span
                      key={i}
                      style={{
                        ...themePickerStyles.swatchDot,
                        background: c,
                        border: '1px solid ' + (i === 0 ? 'rgba(255,255,255,0.18)' : 'transparent'),
                      }}
                    />
                  ))}
                  {active && (
                    <span style={{ ...themePickerStyles.checkBadge, color: accent }}>●</span>
                  )}
                </div>
                <div style={{ ...themePickerStyles.cardLabel, color: textOn(th.swatch[0]) }}>
                  {th.label}
                </div>
                <div style={{ ...themePickerStyles.cardSub, color: mutedOn(th.swatch[0]) }}>
                  {th.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </TweakSection>
    </TweaksPanel>
  );
}

(function mountTweaks() {
  const mount = () => {
    const node = document.createElement('div');
    node.id = 'sg-tweaks-root';
    document.body.appendChild(node);
    const root = ReactDOM.createRoot(node);
    root.render(<ThemePicker />);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
