const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadDotEnv() {
  const cwd = process.cwd();
  const candidates = [path.join(cwd, '.env.local'), path.join(cwd, '.env')];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf8');
        content.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const idx = trimmed.indexOf('=');
          if (idx === -1) return;
          const key = trimmed.slice(0, idx).trim();
          let val = trimmed.slice(idx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) process.env[key] = val;
        });
        console.log(`Loaded environment variables from ${p}`);
        return;
      } catch (err) {
        // ignore and continue
      }
    }
  }
}

(async () => {
  try {
    loadDotEnv();

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI is not set. Create a .env.local (or set env var) with MONGODB_URI and try again.');
      process.exit(2);
    }

    console.log('Attempting to connect to MongoDB using URI:');
    console.log(uri);

    // Use similar options as your app
    await mongoose.connect(uri, { bufferCommands: false });
    console.log('✅ Connected to MongoDB successfully');

    // Close connection cleanly
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Database connection failed:');
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
