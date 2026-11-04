import { libraryCopy, maxListedAuthors } from './library.constants';
import { ILibraryGroup } from './library.interfaces';
import { ILibraryFilter } from './library.types';

type ILibraryItem = Afterword.Firestore.Library.ILibraryItem;

export function groupByNote(items: ILibraryItem[], filter: ILibraryFilter): ILibraryGroup[] {
  const groups = new Map<string, ILibraryGroup>();
  const visibleItems = filter === 'all' ? items : items.filter((item) => item.kind === filter);

  for (const item of visibleItems) {
    const title = item.noteSummary?.trim() ?? '';
    const group = groups.get(title) ?? { key: title, title: title || libraryCopy.OTHER_GROUP, items: [] };
    group.items.push(item);
    groups.set(title, group);
  }

  const noteGroups = Array.from(groups.values()).filter((group) => group.key !== '');
  const otherGroup = groups.get('');

  return otherGroup ? [...noteGroups, otherGroup] : noteGroups;
}

export function formatByline(item: ILibraryItem): string {
  if (item.kind === 'post' && item.sourceHandle) {
    return `@${item.sourceHandle.replace(/^@/, '')}`;
  }

  const listed = item.authors.slice(0, maxListedAuthors).join(', ');

  return item.authors.length > maxListedAuthors ? `${listed} ${libraryCopy.ET_AL}` : listed;
}
