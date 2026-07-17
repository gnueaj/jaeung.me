import fs from "fs/promises";
import mime from "mime-types";
import { NextRequest } from "next/server";
import path from "path";

const BASE_ASSET_DIRECTORY = process.cwd();
const ALLOWED_TOP_LEVEL_DIRS = ["content"];

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ assetPath?: string[] }> },
) {
  // Await the params object to ensure it's ready
  const params = await context.params;

  if (!params.assetPath || params.assetPath.length === 0) {
    return new Response("File path is required", { status: 400 });
  }

  const requestedPathSegments = params.assetPath;

  if (
    ALLOWED_TOP_LEVEL_DIRS.length > 0 &&
    !ALLOWED_TOP_LEVEL_DIRS.includes(requestedPathSegments[0])
  ) {
    console.warn(
      `Access denied: Path does not start with an allowed directory. Attempted: ${requestedPathSegments.join("/")}`,
    );
    return new Response("Forbidden: Access to this path is not allowed.", { status: 403 });
  }

  const relativeAssetPath = path.join(...requestedPathSegments);
  const absoluteAssetPath = path.resolve(BASE_ASSET_DIRECTORY, relativeAssetPath);

  const resolvedBaseDirForAllowedPath = path.resolve(
    BASE_ASSET_DIRECTORY,
    requestedPathSegments[0],
  );
  if (!absoluteAssetPath.startsWith(resolvedBaseDirForAllowedPath)) {
    console.warn(
      `Path traversal attempt detected: ${relativeAssetPath} resolved to ${absoluteAssetPath}`,
    );
    return new Response("Forbidden: Invalid file path.", { status: 403 });
  }

  try {
    await fs.access(absoluteAssetPath, fs.constants.R_OK);
    const fileBuffer = await fs.readFile(absoluteAssetPath);
    const contentType = mime.lookup(absoluteAssetPath) || "application/octet-stream";

    return new Response(fileBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error(`Error serving asset ${absoluteAssetPath}:`, error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
