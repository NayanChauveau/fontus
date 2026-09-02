import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createFileDisImport } from "./createFileDisImport";

describe("createFileDisImport", () => {
  it("parses DIS files from a directory and ignores a missing folder", async () => {
    const directory = await mkdtemp(join(tmpdir(), "eau-dis-"));
    await writeFile(
      join(directory, "DIS_UDI_COM.txt"),
      "cdreseau;inseecommune\n033001214;33063\n",
    );
    await writeFile(
      join(directory, "DIS_PLV.txt"),
      "cdreseau;referenceprel;dateprel\n033001214;P1;2026-06-18\n",
    );
    await writeFile(
      join(directory, "DIS_RESULT.txt"),
      "referenceprel;cdparametre;libmajparametre;rqana\nP1;1340;Nitrates;8\n",
    );

    const samples = await createFileDisImport(directory).listByNetwork(
      "033001214",
      "2025-09-02",
    );
    expect(samples).toHaveLength(1);
    expect(samples[0]?.measurements[0]?.rawText).toBe("8");

    expect(await createFileDisImport("").listByNetwork("033001214", "2025-09-02")).toEqual(
      [],
    );
    expect(
      await createFileDisImport("/tmp/eau-dis-missing").listByNetwork(
        "033001214",
        "2025-09-02",
      ),
    ).toEqual([]);
  });

  it("returns nothing when PLV or RESULT is missing", async () => {
    const directory = await mkdtemp(join(tmpdir(), "eau-dis-"));
    await writeFile(join(directory, "DIS_PLV.txt"), "cdreseau;referenceprel\n");
    expect(
      await createFileDisImport(directory).listByNetwork("033001214", "2025-09-02"),
    ).toEqual([]);
  });
});
