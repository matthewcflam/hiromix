// import fs from "node:fs";
// import path from "node:path";
// import process from "node:process";

// const repoRoot = process.cwd();
// const timelineFile = path.join(repoRoot, "src", "data", "timeline.ts");
// const publicDir = path.join(repoRoot, "public");

// if (!fs.existsSync(timelineFile)) {
//   console.error(`❌ Timeline file not found: ${timelineFile}`);
//   process.exit(1);
// }

// const timelineSource = fs.readFileSync(timelineFile, "utf8");
// const arrayMatch = timelineSource.match(/timelineData\s*:\s*TimelineItem\[\]\s*=\s*\[([\s\S]*?)\];/m);

// if (!arrayMatch) {
//   console.error("❌ Could not parse timelineData array in src/data/timeline.ts");
//   process.exit(1);
// }

// const objects = arrayMatch[1].match(/\{[\s\S]*?\}\s*,?/g) ?? [];
// const errors = [];
// const warnings = [];
// const idRegistry = new Map();

// const getField = (objectSource, fieldName) => {
//   const match = objectSource.match(new RegExp(`${fieldName}\\s*:\\s*"([^"]+)"`));
//   return match?.[1] ?? null;
// };

// const hasExactCasePath = (relativePathFromPublic) => {
//   const normalized = relativePathFromPublic.replaceAll("\\", "/").replace(/^\/+/, "");
//   const parts = normalized.split("/").filter(Boolean);

//   let currentDir = publicDir;
//   for (const part of parts) {
//     if (!fs.existsSync(currentDir)) {
//       return false;
//     }

//     const entries = fs.readdirSync(currentDir);
//     if (!entries.includes(part)) {
//       return false;
//     }

//     currentDir = path.join(currentDir, part);
//   }

//   return true;
// };

// const ensurePublicAsset = (timelineId, fieldName, urlPath) => {
//   if (!urlPath) return;
//   if (!urlPath.startsWith("/")) {
//     errors.push(
//       `id=${timelineId}: ${fieldName} must start with "/". Found "${urlPath}".`
//     );
//     return;
//   }

//   const relativePath = urlPath.slice(1);
//   const absolutePath = path.join(publicDir, relativePath);

//   if (!fs.existsSync(absolutePath)) {
//     errors.push(
//       `id=${timelineId}: ${fieldName} points to missing file "${urlPath}" (expected ${absolutePath}).`
//     );
//     return;
//   }

//   if (!hasExactCasePath(relativePath)) {
//     errors.push(
//       `id=${timelineId}: ${fieldName} has case mismatch for "${urlPath}". Vercel/Linux paths are case-sensitive.`
//     );
//   }
// };

// for (const [index, objectSource] of objects.entries()) {
//   const id = getField(objectSource, "id");
//   const type = getField(objectSource, "type");
//   const src = getField(objectSource, "src");
//   const videoSrc = getField(objectSource, "videoSrc");
//   const label = id ? `id=${id}` : `entry #${index + 1}`;

//   if (!id) {
//     errors.push(`${label}: missing required field "id".`);
//     continue;
//   }

//   const seenAt = idRegistry.get(id);
//   if (seenAt !== undefined) {
//     errors.push(`Duplicate timeline id "${id}" at entries #${seenAt + 1} and #${index + 1}.`);
//   } else {
//     idRegistry.set(id, index);
//   }

//   if (!type) {
//     errors.push(`${label}: missing required field "type".`);
//     continue;
//   }

//   ensurePublicAsset(id, "src", src);

//   if (type === "video") {
//     if (!videoSrc) {
//       errors.push(`${label}: type=video requires "videoSrc".`);
//     } else {
//       ensurePublicAsset(id, "videoSrc", videoSrc);
//       if (videoSrc.toLowerCase().endsWith(".mov")) {
//         warnings.push(
//           `${label}: uses MOV (${videoSrc}). Consider MP4/H.264 for broader browser compatibility.`
//         );
//       }
//     }
//   }
// }

// if (warnings.length > 0) {
//   console.warn("⚠️ Timeline validation warnings:");
//   for (const warning of warnings) {
//     console.warn(`- ${warning}`);
//   }
// }

// if (errors.length > 0) {
//   console.error("❌ Timeline validation failed:");
//   for (const error of errors) {
//     console.error(`- ${error}`);
//   }
//   process.exit(1);
// }

// console.log(`✅ Timeline validation passed (${objects.length} entries checked).`);
