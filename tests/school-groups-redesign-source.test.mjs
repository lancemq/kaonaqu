import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('school groups page is no longer wrapped in the legacy SiteShell', () => {
  const pageSource = readFileSync('app/schools/groups/page.js', 'utf8');
  const clientSource = readFileSync('components/groups-page-client.js', 'utf8');

  assert.doesNotMatch(pageSource, /<SiteShell/);
  assert.match(pageSource, /className="schools-aerial-page school-groups-aerial-page"/);
  assert.doesNotMatch(clientSource, /schools-datadesk-layout/);
  assert.doesNotMatch(clientSource, /school-groups-hero"/);
  assert.match(clientSource, /className="school-groups-aerial-hero"/);
  assert.match(clientSource, /className="school-groups-aerial-list"/);
  assert.doesNotMatch(clientSource, /prototype-page-footer/);
  assert.match(clientSource, /className="schools-aerial-footer"/);
});
