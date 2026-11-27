import 'styled-components';
import type { AppTheme } from './theme';

declare module 'styled-components' {
  // Augmentation: DefaultTheme must be an interface to merge with the library's declaration.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
