/** Design tokens shared by every styled component. */
export const theme = {
  colors: {
    primary: '#a65ba0',
    primaryDark: '#8a4785',
    primaryLight: '#c98bc3',
    background: '#131316',
    text: '#ecebef',
    mutedText: '#9a98a3',
    faintText: '#6e6c76',
    surface: '#1d1e22',
    surfaceMuted: '#25262b',
    surfaceHover: '#2e2f35',
    surfaceInset: '#151619',
    border: 'rgba(255, 255, 255, 0.09)',
    cellSurface: '#f3f3f3',
    cellText: '#1f1f23',
    danger: '#c0394b',
    dangerDark: '#a32c3d',
    dangerText: '#f3b3bc',
    dangerBackground: 'rgba(192, 57, 75, 0.16)',
    dangerBorder: 'rgba(192, 57, 75, 0.45)',
    secondary: '#33343a',
    secondaryDark: '#414249',
    focus: '#ffbf47',
    focusInner: '#222222',
    overlay: 'rgba(0, 0, 0, 0.75)',
  },
  gradients: {
    page: 'radial-gradient(ellipse at 75% 0%, #26222b 0%, #16161a 45%, #111114 100%)',
    primary: 'linear-gradient(135deg, #b068a9 0%, #95508f 100%)',
    primaryHover: 'linear-gradient(135deg, #bd77b6 0%, #a05a9a 100%)',
    free: 'linear-gradient(160deg, #b974b2 0%, #7c3e77 100%)',
    cell: '#f3f3f3',
    topThree: 'linear-gradient(90deg, rgba(166, 91, 160, 0.22) 0%, rgba(166, 91, 160, 0) 100%)',
    topThreeHover: 'linear-gradient(90deg, rgba(166, 91, 160, 0.32) 0%, rgba(166, 91, 160, 0.06) 100%)',
  },
  fonts: {
    display: "'Cinzel', 'Times New Roman', serif",
    body: "'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif",
  },
  shadows: {
    card: '0 24px 60px rgba(0, 0, 0, 0.45)',
    raised: '0 6px 16px rgba(0, 0, 0, 0.35)',
    modal: '0 20px 60px rgba(0, 0, 0, 0.6)',
  },
  radii: {
    small: '4px',
    medium: '10px',
    large: '14px',
  },
  breakpoints: {
    mobile: '768px',
    tablet: '900px',
  },
} as const;

export type AppTheme = typeof theme;
