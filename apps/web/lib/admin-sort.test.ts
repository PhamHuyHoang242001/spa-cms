import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clickColumnIcon,
  isIconActive,
  DEFAULT_ADMIN_DIR,
  DEFAULT_ADMIN_SORT,
} from './admin-sort.ts';

const idle = { sort: DEFAULT_ADMIN_SORT, dir: DEFAULT_ADMIN_DIR, pinned: false };

describe('clickColumnIcon', () => {
  it('pins a column sort and colors that icon', () => {
    const next = clickColumnIcon(idle, 'name', 'asc');
    assert.deepEqual(next, { sort: 'name', dir: 'asc', pinned: true });
    assert.equal(isIconActive(next, 'name', 'asc'), true);
    assert.equal(isIconActive(next, 'name', 'desc'), false);
    assert.equal(isIconActive(idle, 'createdAt', 'desc'), false);
  });

  it('clicking the same icon again clears to createdAt desc', () => {
    const pinned = clickColumnIcon(idle, 'email', 'desc');
    const cleared = clickColumnIcon(pinned, 'email', 'desc');
    assert.deepEqual(cleared, { sort: 'createdAt', dir: 'desc', pinned: false });
    assert.equal(isIconActive(cleared, 'email', 'desc'), false);
  });
});
