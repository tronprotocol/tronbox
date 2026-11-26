const { expect } = require('chai');
const fs = require('fs-extra');
const path = require('path');
const { runCli, makeTmp, removeTmp } = require('./helpers');

describe('deprecated tronbox unbox', function () {
  this.timeout(30_000);

  let tmp;
  beforeEach(() => {
    tmp = makeTmp();
  });
  afterEach(() => removeTmp(tmp));

  it('exits without creating a project', () => {
    const r = runCli(['unbox'], { cwd: tmp });
    expect(r.status).to.not.equal(0);
    expect(r.stdout).to.equal('');
    expect(fs.readdirSync(tmp)).to.deep.equal([]);
  });

  it('shows the notice with legacy arguments without modifying existing files', () => {
    const existingFile = path.join(tmp, 'existing.txt');
    fs.writeFileSync(existingFile, 'keep me');

    const r = runCli(['unbox', 'metacoin-box', '--quiet'], { cwd: tmp });
    expect(r.status).to.not.equal(0);
    expect(r.stderr).to.include('no longer supported');
    expect(fs.readdirSync(tmp)).to.deep.equal(['existing.txt']);
    expect(fs.readFileSync(existingFile, 'utf8')).to.equal('keep me');
  });
});
