import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { DisImportPort } from "../../application/ports/DisImportPort";
import { parseDisExport } from "../../domain/parseDisExport";

export function createFileDisImport(directory: string): DisImportPort {
  return {
    async listByNetwork(networkCode, dateMin) {
      if (!directory) {
        return [];
      }

      try {
        const files = await readdir(directory);
        const udiCom = await readNamed(directory, files, /udi_com/i);
        const plv = await readNamed(directory, files, /plv/i);
        const result = await readNamed(directory, files, /result/i);
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

async function readNamed(
  directory: string,
  files: string[],
  pattern: RegExp,
): Promise<string | undefined> {
  const name = files.find((file) => pattern.test(file));
  if (!name) {
    return undefined;
  }
  return readFile(join(directory, name), "utf8");
}
