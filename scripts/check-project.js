import fs from 'node:fs';

const requiredPaths = [
  'AGENTS.md',
  'README.md',
  'index.html',
  'manifest.webmanifest',
  'service-worker.js',
  'docs/game-design.md',
  'docs/technical-asset-decisions.md',
  'docs/animation-gameplay-guide.md',
  'docs/architecture.md',
  'docs/roadmap.md',
  'src/main.js',
  'src/core/game.js',
  'src/world/tile-map.js',
  'src/entities/player.js',
  'assets/ui/icon-192.png',
  'assets/ui/icon-512.png'
];

const missing = requiredPaths.filter((path) => !fs.existsSync(path));

if (missing.length > 0) {
  console.error('Fehlende Projektdateien:');
  for (const path of missing) {
    console.error(`- ${path}`);
  }
  process.exit(1);
}

console.log('Projektstruktur OK.');
