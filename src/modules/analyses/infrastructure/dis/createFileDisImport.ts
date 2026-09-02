import { readdir, readFile, realpath, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { DisImportPort } from "../../application/ports/DisImportPort";
import { parseDisExport } from "../../domain/parseDisExport";

const MAX_FILE_BYTES = 8_000_000;

export function createFileDisImport(directory: string): DisImportPort {
  return {
    async listByNetwork(networkCode, dateMin) {
      if (!directory) {
        return [];
      }

      try {
        const root = await realpath(resolve(directory));
        const files = await readdir(root);
        const udiCom = await readNamed(root, files, "udiCom");
        const plv = await readNamed(root, files, "plv");
        const result = await readNamed(root, files, "result");
        if (!plv || !result) {
          return [];
        }

        return parseDisExport({
          udiCom,
          plv,
          result,
          networkCode,
          dateMin,
        });
      } catch {
        return [];
      }
    },
  };
}

function classifyDisFile(file: string): "udiCom" | "plv" | "result" | null {
  const base = file.replace(/\.[^.]+$/, "").toUpperCase();
  if (base === "UDI_COM" || base === "DIS_UDI_COM") {
    return "udiCom";
  }
  if (base === "PLV" || base === "DIS_PLV") {
    return "plv";
  }
  if (base === "RESULT" || base === "DIS_RESULT") {
    return "result";
  }
  return null;
}

async function readNamed(
  directory: string,
  files: string[],
  kind: "udiCom" | "plv" | "result",
): Promise<string | undefined> {
  const name = files.find((file) => classifyDisFile(file) === kind);
  if (!name) {
    return undefined;
  }
  const path = await realpath(join(directory, name));
  if (!path.startsWith(directory)) {
    return undefined;
  }
  const info = await stat(path);
  if (!info.isFile() || info.size > MAX_FILE_BYTES) {
    return undefined;
  }
  return readFile(path, "utf8");
}
