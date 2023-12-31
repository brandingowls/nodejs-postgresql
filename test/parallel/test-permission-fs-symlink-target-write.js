// Flags: --experimental-permission --allow-fs-read=* --allow-fs-write=* --allow-child-process
'use strict';

const common = require('../common');
common.skipIfWorker();
if (!common.canCreateSymLink())
  common.skip('insufficient privileges');
if (!common.hasCrypto)
  common.skip('no crypto');

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const tmpdir = require('../common/tmpdir');
const fixtures = require('../common/fixtures');
const { spawnSync } = require('child_process');

{
  tmpdir.refresh();
}

const readOnlyFolder = tmpdir.resolve('read-only');
const readWriteFolder = tmpdir.resolve('read-write');
const writeOnlyFolder = tmpdir.resolve('write-only');
const file = fixtures.path('permission', 'fs-symlink-target-write.js');
const commonPathWildcard = path.join(__filename, '../../common*');

fs.mkdirSync(readOnlyFolder);
fs.mkdirSync(readWriteFolder);
fs.mkdirSync(writeOnlyFolder);
fs.writeFileSync(path.join(readOnlyFolder, 'file'), 'evil file contents');
fs.writeFileSync(path.join(readWriteFolder, 'file'), 'NO evil file contents');

{
  const { status, stderr } = spawnSync(
    process.execPath,
    [
      '--experimental-permission',
      `--allow-fs-read=${file},${commonPathWildcard},${readOnlyFolder},${readWriteFolder}`,
      `--allow-fs-write=${readWriteFolder},${writeOnlyFolder}`,
      file,
    ],
    {
      env: {
        ...process.env,
        READONLYFOLDER: readOnlyFolder,
        WRITEONLYFOLDER: writeOnlyFolder,
        READWRITEFOLDER: readWriteFolder,
      },
    }
  );
  assert.strictEqual(status, 0, stderr.toString());
}

{
  tmpdir.refresh();
}
