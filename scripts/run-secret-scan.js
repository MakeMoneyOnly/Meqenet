const { spawnSync } = require('child_process');
const path = require('path');

const cwd = process.cwd();
const trufflehogignorePath = path.join(cwd, '.trufflehogignore');

const command = `docker run --rm -v "${cwd}:/repo" -v "${trufflehogignorePath}:/.trufflehogignore" trufflesecurity/trufflehog:latest filesystem --only-verified --no-update --fail --json /repo -x /.trufflehogignore`;

console.log(`Running secret scan with command: ${command}`);

const result = spawnSync(command, [], {
  stdio: 'inherit',
  shell: true,
});

if (result.error) {
  console.error('Failed to start subprocess for secret scan.', result.error);
  process.exit(1);
}

process.exit(result.status);
