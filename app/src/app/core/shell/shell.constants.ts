import { INavItem } from './shell.interfaces';

export const navItems: INavItem[] = [
  { label: 'Notes', icon: 'sticky_note_2', route: '/notes' },
  { label: 'Briefing', icon: 'mail', route: '/briefings' },
  { label: 'Library', icon: 'bookmarks', route: '/library' },
];
