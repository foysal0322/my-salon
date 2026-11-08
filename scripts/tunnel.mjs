import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const urlFilePath = path.join(rootDir, "tunnel-url.txt");
const logFilePath = path.join(rootDir, "tunnel.log");

// Reset log and url files
fs.writeFileSync(logFilePath, `[${new Date().toISOString()}] Starting cloudflared tunnel...\n`);
if (fs.existsSync(urlFilePath)) {
  fs.unlinkSync(urlFilePath);
}

const logStream = fs.createWriteStream(logFilePath, { flags: "a" });

console.log("\x1b[36m[AmarSaloon Tunnel]\x1b[0m Starting Cloudflare Quick Tunnel for http://localhost:3000...");

const child = spawn(
  "cloudflared",
  ["tunnel", "--http-host-header", "localhost:3000", "--url", "http://localhost:3000"],
  {
    stdio: ["inherit", "pipe", "pipe"],
    shell: true,
  }
);

let detectedUrl = null;

function processChunk(chunk) {
  const text = chunk.toString();
  process.stdout.write(text);
  logStream.write(text);

  if (!detectedUrl) {
    const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (match) {
      detectedUrl = match[0];
      fs.writeFileSync(urlFilePath, `${detectedUrl}\n`, "utf-8");

      console.log("\n\x1b[32m" + "=".repeat(65));
      console.log(`  TUNNEL ACTIVE!`);
      console.log(`  Public URL: ${detectedUrl}`);
      console.log(`  Saved to:   ${path.relative(process.cwd(), urlFilePath)}`);
      console.log("=".repeat(65) + "\x1b[0m\n");
    }
  }
}

child.stdout.on("data", processChunk);
child.stderr.on("data", processChunk);

child.on("close", (code) => {
  logStream.end();
  if (code !== 0 && code !== null) {
    console.error(`\x1b[31mCloudflared exited with code ${code}\x1b[0m`);
  }
  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  child.kill("SIGINT");
});
process.on("SIGTERM", () => {
  child.kill("SIGTERM");
});

