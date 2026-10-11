import { withBase } from '../config';

export const nav = [
  { label: 'Reviews', link: withBase('/reviews/') },
  { label: 'Blog', link: withBase('/blogs/') },
] as const;

export type NavItem = (typeof nav)[number];
