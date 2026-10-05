export type SortDir = 'asc' | 'desc';

export const DEFAULT_ADMIN_SORT = 'createdAt';
export const DEFAULT_ADMIN_DIR: SortDir = 'desc';

export type ColumnSortState = {
  sort: string;
  dir: SortDir;
  pinned: boolean;
};

/** Click same active icon → clear to default createdAt desc. Else pin that sort. */
export function clickColumnIcon(
  current: ColumnSortState,
  columnKey: string,
  iconDir: SortDir,
): ColumnSortState {
  if (current.pinned && current.sort === columnKey && current.dir === iconDir) {
    return { sort: DEFAULT_ADMIN_SORT, dir: DEFAULT_ADMIN_DIR, pinned: false };
  }
  return { sort: columnKey, dir: iconDir, pinned: true };
}

export function isIconActive(state: ColumnSortState, columnKey: string, iconDir: SortDir) {
  return state.pinned && state.sort === columnKey && state.dir === iconDir;
}
