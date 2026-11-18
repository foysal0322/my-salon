import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

console.log("==========================================");
console.log("  AmarSalon (আমার সেলুন) — Android APK Builder");
console.log("==========================================\n");

const rootDir = process.cwd();
const androidDir = path.join(rootDir, "android");

if (!fs.existsSync(androidDir)) {
  console.error("❌ Error: android/ directory not found! Run 'npx cap add android' first.");
  process.exit(1);
}

try {
  console.log("📦 1. Syncing web assets and Capacitor configuration...");
  execSync("npx cap sync android", { stdio: "inherit", cwd: rootDir });

  console.log("\n🔨 2. Compiling Android APK with Gradle...");
  const gradlewCmd = process.platform === "win32" ? ".\\gradlew.bat" : "./gradlew";

  // Set ANDROID_HOME and JAVA_HOME if not defined
  const env = { ...process.env };
  if (!env.ANDROID_HOME) {
    env.ANDROID_HOME = "D:\\Android\\Sdk";
  }
  if (fs.existsSync("C:\\Program Files\\Java\\jdk-21")) {
    env.JAVA_HOME = "C:\\Program Files\\Java\\jdk-21";
  }

  execSync(`${gradlewCmd} assembleDebug`, {
    stdio: "inherit",
    cwd: androidDir,
    env,
  });

  const apkPath = path.join(
    androidDir,
    "app",
    "build",
    "outputs",
    "apk",
    "debug",
    "app-debug.apk"
  );

  if (fs.existsSync(apkPath)) {
    const stats = fs.statSync(apkPath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

    const rootApkPath = path.join(rootDir, "AmarSalon.apk");
    fs.copyFileSync(apkPath, rootApkPath);

    console.log("\n==========================================");
    console.log("  🎉 APK Build Succeeded!");
    console.log("==========================================");
    console.log(`📁 Root APK:     ${rootApkPath}`);
    console.log(`📁 Gradle Build: ${apkPath}`);
    console.log(`⚖️ APK File Size: ${sizeMb} MB (Ultra-Lightweight)`);
    console.log("\n📱 To install directly to a connected Android phone:");
    console.log("   adb install -r android/app/build/outputs/apk/debug/app-debug.apk");
    console.log("\n✨ Or copy 'app-debug.apk' to your phone and tap to install!");
  } else {
    console.error("❌ Error: Gradle finished but app-debug.apk was not found.");
    process.exit(1);
  }
} catch (error) {
  console.error("\n❌ Build failed:", error.message);
  process.exit(1);
}
