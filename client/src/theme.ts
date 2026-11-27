/** Design tokens shared by every styled component. */
export const theme = {
  colors: {
    primary: '#667eea',
    primaryDark: '#764ba2',
    text: '#333333',
    mutedText: '#6c757d',
    surface: '#ffffff',
    surfaceMuted: '#f8f9fa',
    surfaceHover: '#e9ecef',
    border: '#e0e0e0',
    danger: '#dc3545',
    dangerDark: '#c82333',
    dangerText: '#842029',
    dangerBackground: '#f8d7da',
    dangerBorder: '#f5c6cb',
    secondary: '#6c757d',
    secondaryDark: '#5a6268',
    focus: '#ffbf47',
    focusInner: '#222222',
    overlay: 'rgba(0, 0, 0, 0.75)',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    primaryHover: 'linear-gradient(135deg, #5568d3 0%, #653a8b 100%)',
    free: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    cell: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    topThree: 'linear-gradient(90deg, #fff9e6 0%, #ffffff 100%)',
    topThreeHover: 'linear-gradient(90deg, #fff5d6 0%, #f8f9fa 100%)',
  },
  shadows: {
    card: '0 8px 32px rgba(0, 0, 0, 0.2)',
    raised: '0 4px 12px rgba(0, 0, 0, 0.15)',
    modal: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  radii: {
    small: '8px',
    medium: '16px',
    large: '20px',
  },
  breakpoints: {
    mobile: '768px',
  },
} as const;

export type AppTheme = typeof theme;
