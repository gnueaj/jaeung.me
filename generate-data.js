#!/usr/bin/env node
// ^ Shebang 추가: CLI에서 직접 실행 가능하도록

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs").promises;
const path = require("path");
const yaml = require("js-yaml");
const chokidar = require("chokidar");
const { quicktype, InputData, jsonInputForTargetLanguage } = require("quicktype-core");
async function main() {
  const { default: yargs } = await import("yargs/yargs");
  const { hideBin } = await import("yargs/helpers");

  // --- Argument Parsing ---
  const argv = yargs(hideBin(process.argv))
    .option("input", {
      alias: "i",
      type: "string",
      description: "Path to the directory containing YAML files",
      default: path.resolve(process.cwd(), "data"),
      coerce: (p) => path.resolve(p),
    })
    .option("outputDir", {
      alias: "o",
      type: "string",
      description: "Path to the output directory for generated files",
      default: path.resolve(process.cwd(), "generated"),
      coerce: (p) => path.resolve(p),
    })
    .option("typeFile", {
      alias: "t",
      type: "string",
      description: "Filename for the generated TypeScript types (will be placed in outputDir)",
      default: "data-contracts.ts",
    })
    .option("accessorFile", {
      alias: "a",
      type: "string",
      description:
        "Optional filename for the data accessor class (will be placed in outputDir). If not provided, accessor is not generated.",
      // No default, making it optional
    })
    .option("generateIndex", {
      alias: "x",
      type: "boolean",
      description: "Generate an index.ts file in the outputDir",
      default: false,
    })
    .option("watch", {
      alias: "w",
      type: "boolean",
      description: "Watch for changes in the input directory",
      default: false,
    })
    .usage("Usage: $0 -i [inputDir] -o [outputDir] -t [typeFile] [-a accessorFile] [-x] [-w]")
    .help()
    .alias("help", "h")
    .version(false)
    .strict().argv;

  // --- Constants from Arguments ---
  const DATA_DIR = argv.input;
  const OUTPUT_DIR = argv.outputDir;
  const TYPE_FILENAME = argv.typeFile;
  const ACCESSOR_FILENAME = argv.accessorFile; // This will be undefined if not provided
  const GENERATE_INDEX = argv.generateIndex;
  const WATCH_MODE = argv.watch;

  // --- Calculated Paths ---
  const TYPE_OUTPUT_PATH = path.join(OUTPUT_DIR, TYPE_FILENAME);
  const ACCESSOR_OUTPUT_PATH = ACCESSOR_FILENAME ? path.join(OUTPUT_DIR, ACCESSOR_FILENAME) : null;
  const INDEX_OUTPUT_PATH = GENERATE_INDEX ? path.join(OUTPUT_DIR, "index.ts") : null;

  console.log(`Input YAML Directory: ${DATA_DIR}`);
  console.log(`Output Directory:     ${OUTPUT_DIR}`);
  console.log(`Type Definition File: ${TYPE_OUTPUT_PATH}`);
  if (ACCESSOR_OUTPUT_PATH) {
    console.log(`Data Accessor File:   ${ACCESSOR_OUTPUT_PATH}`);
  } else {
    console.log("Data Accessor File:   Not generating accessor.");
  }
  if (INDEX_OUTPUT_PATH) {
    console.log(`Index File:           ${INDEX_OUTPUT_PATH}`);
  } else {
    console.log("Index File:           Not generating index.ts.");
  }

  if (WATCH_MODE) {
    console.log("Watch Mode:           Enabled");
  }

  // 파일명을 PascalCase로 변환하는 함수
  function toPascalCase(str) {
    return str
      .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
      .map((x) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase())
      .join("");
  }

  // 파일명을 camelCase로 변환하는 함수
  function toCamelCase(str) {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  let isGeneratingTypes = false;

  async function generateTypes() {
    if (isGeneratingTypes) {
      console.log("🔄 Type generation already in progress, skipping...");
      return;
    }
    isGeneratingTypes = true;
    console.log("🔄 Generating types from YAML files using quicktype...");

    try {
      // 출력 디렉토리가 존재하지 않으면 생성
      try {
        await fs.access(OUTPUT_DIR);
      } catch {
        console.log(`Creating output directory: ${OUTPUT_DIR}`);
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
      }

      let files;
      try {
        files = await fs.readdir(DATA_DIR);
      } catch (err) {
        if (err.code === "ENOENT") {
          console.error(`❌ Error: Input directory not found: ${DATA_DIR}`);
          if (!WATCH_MODE) process.exit(1);
          isGeneratingTypes = false;
          return;
        } else {
          console.error(`❌ Error reading input directory ${DATA_DIR}:`, err);
          if (!WATCH_MODE) process.exit(1);
          isGeneratingTypes = false;
          return;
        }
      }

      const yamlFiles = files.filter((file) => file.endsWith(".yaml") || file.endsWith(".yml"));

      if (yamlFiles.length === 0) {
        console.log(`🤷 No YAML files found in ${DATA_DIR}. Skipping generation.`);
        isGeneratingTypes = false;
        return;
      }

      const inputData = new InputData();
      let processedFileCount = 0;
      const fileMetadata = [];

      for (const file of yamlFiles) {
        const filePath = path.join(DATA_DIR, file);
        const baseName = path.parse(file).name;
        const typeName = toPascalCase(baseName);
        const methodName = toCamelCase(baseName);

        try {
          const fileContent = await fs.readFile(filePath, "utf8");
          const yamlData = yaml.load(fileContent);

          if (yamlData === null || typeof yamlData !== "object" || Array.isArray(yamlData)) {
            console.warn(`⚠️ Skipping ${file}: Content is not a valid YAML object.`);
            continue;
          }
          if (Object.keys(yamlData).length === 0) {
            console.warn(`⚠️ Skipping ${file}: Content is an empty object.`);
            continue;
          }

          const jsonString = JSON.stringify(yamlData);
          const source = { name: typeName, samples: [jsonString] };

          await inputData.addSource("json", source, () => jsonInputForTargetLanguage("typescript"));
          processedFileCount++;
          fileMetadata.push({
            typeName,
            methodName,
            filePath: path.relative(process.cwd(), filePath),
            baseName,
            extension: path.extname(file),
          });
        } catch (err) {
          console.error(`❌ Error processing file ${file}:`, err.message || err);
        }
      }

      if (processedFileCount === 0) {
        console.log("🤷 No valid YAML object data found to generate types from.");
        isGeneratingTypes = false;
        return;
      }

      const quicktypeOptions = {
        inputData,
        lang: "typescript",
        rendererOptions: {
          "just-types": "true",
          "nice-property-names": "true",
          "acronym-style": "original",
          "prefer-interfaces": "true",
        },
      };

      const result = await quicktype(quicktypeOptions);
      let outputContent = `// This file is auto-generated by yaml-typegen.js using quicktype\n`;
      outputContent += `// Input directory: ${path.relative(process.cwd(), DATA_DIR)}\n`;
      outputContent += `// Do not edit this file directly.\n\n`;
      outputContent += result.lines.join("\n");

      await fs.writeFile(TYPE_OUTPUT_PATH, outputContent, "utf8");
      console.log(`✅ Types generated successfully at ${TYPE_OUTPUT_PATH}`);

      if (ACCESSOR_OUTPUT_PATH) {
        // Generate accessor only if filename is provided
        await generateDataAccessor(fileMetadata);
      } else if (GENERATE_INDEX) {
        // If no accessor but index is requested, generate index with only types
        await generateIndexFile(true, false); // hasTypes = true, hasAccessor = false
      }
    } catch (error) {
      console.error("❌ Error during quicktype generation process:", error);
      if (!WATCH_MODE) process.exit(1);
    } finally {
      isGeneratingTypes = false;
    }
  }

  async function generateDataAccessor(fileMetadata) {
    if (!ACCESSOR_OUTPUT_PATH) return; // Should not happen if called correctly

    try {
      console.log("🔄 Generating data accessor class...");

      const typeImportFilenameNoExt = TYPE_FILENAME.replace(/\.(ts|js)$/, "");

      const accessorContent = `/* eslint-disable @typescript-eslint/no-explicit-any */\n// This file is auto-generated by yaml-typegen.js\n// Input directory: ${path.relative(process.cwd(), DATA_DIR)}\n// Do not edit this file directly.\n\nimport fs from 'fs';\nimport path from 'path';\nimport yaml from 'js-yaml';\nimport { ${fileMetadata.map((m) => m.typeName).join(", ")} } from './${typeImportFilenameNoExt}';\n\n// Path to the YAML data directory, relative to process.cwd() for runtime\nconst YAML_DATA_DIR = path.resolve(process.cwd(), '${path.relative(process.cwd(), DATA_DIR)}');\n\n/**\n * DataAccessor provides type-safe access to YAML data files\n */\nexport class DataAccessor {\n  private cache: Record<string, any> = {};\n\n  /**\n   * Clears the data cache, forcing fresh reads from disk\n   */\n  public clearCache(): void {\n    this.cache = {};\n  }\n\n${fileMetadata
        .map((meta) => {
          const { typeName, methodName, baseName, extension } = meta;
          return `  /**\n   * Loads data from ${baseName}${extension}\n   * @param useCache Use cached data if available (default: true)\n   * @returns ${typeName} object\n   */\n  public ${methodName}(useCache: boolean = true): ${typeName} {\n    const cacheKey = '${methodName}';\n    if (useCache && this.cache[cacheKey]) {\n      return this.cache[cacheKey] as ${typeName};\n    }\n\n    try {\n      const filePath = path.join(YAML_DATA_DIR, '${baseName}${extension}');\n      const fileContent = fs.readFileSync(filePath, 'utf8');\n      const data = yaml.load(fileContent) as ${typeName};\n      this.cache[cacheKey] = data;\n      return data;\n    } catch (error) {\n      console.error(\`Error loading ${baseName}${extension}: \${error}\`);\n      throw error;\n    }\n  }\n`;
        })
        .join(
          "\n",
        )}\n  /**\n   * Singleton instance\n   */\n  private static _instance: DataAccessor;\n\n  /**\n   * Get singleton instance\n   */\n  public static get instance(): DataAccessor {\n    if (!DataAccessor._instance) {\n      DataAccessor._instance = new DataAccessor();\n    }\n    return DataAccessor._instance;\n  }\n}\n\n/**\n * Singleton data accessor instance for convenient access\n * Use this for easy data access: data.${fileMetadata.length > 0 ? fileMetadata[0].methodName : "exampleMethod"}()\n */\nconst data = DataAccessor.instance;\n\nexport default data;`;

      await fs.writeFile(ACCESSOR_OUTPUT_PATH, accessorContent, "utf8");
      console.log(`✅ Data accessor class generated successfully at ${ACCESSOR_OUTPUT_PATH}`);

      if (GENERATE_INDEX) {
        // If index generation is also requested
        await generateIndexFile(true, true); // hasTypes = true, hasAccessor = true
      }
    } catch (error) {
      console.error("❌ Error generating data accessor class:", error);
      if (!WATCH_MODE) process.exit(1);
    }
  }

  async function generateIndexFile(hasTypes, hasAccessor) {
    if (!INDEX_OUTPUT_PATH) return; // Should not happen if called correctly

    try {
      console.log(`🔄 Generating index.ts in ${OUTPUT_DIR}...`);

      let indexContent = `// This file is auto-generated by yaml-typegen.js\n// Do not edit this file directly.\n\n`;

      if (hasTypes) {
        const typeFilenameNoExt = TYPE_FILENAME.replace(/\.(ts|js)$/, "");
        indexContent += `export * from "./${typeFilenameNoExt}";\n`;
      }

      if (hasAccessor && ACCESSOR_FILENAME) {
        // Ensure accessorFile was indeed specified
        const accessorFilenameNoExt = ACCESSOR_FILENAME.replace(/\.(ts|js)$/, "");
        indexContent += `export { default as data } from "./${accessorFilenameNoExt}";\n`;
      }

      await fs.writeFile(INDEX_OUTPUT_PATH, indexContent, "utf8");
      console.log(`✅ index.ts generated successfully at ${INDEX_OUTPUT_PATH}`);
    } catch (error) {
      console.error("❌ Error generating index.ts:", error);
      if (!WATCH_MODE) process.exit(1);
    }
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  const debouncedGenerateTypes = debounce(generateTypes, 300);

  // --- 실행 로직 ---
  await generateTypes(); // Initial generation

  if (WATCH_MODE) {
    console.log(`\n👀 Watching for changes in ${DATA_DIR}...\n`);

    const watchPaths = [
      DATA_DIR,
      path.join(DATA_DIR, "**/*.yaml"),
      path.join(DATA_DIR, "**/*.yml"),
    ];
    const watcher = chokidar.watch(watchPaths, {
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
      ignorePermissionErrors: true,
    });

    watcher
      .on("add", (filePath) => {
        if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) {
          console.log(`\n➕ File added: ${path.basename(filePath)}`);
          debouncedGenerateTypes();
        }
      })
      .on("change", (filePath) => {
        if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) {
          console.log(`\n✏️ File changed: ${path.basename(filePath)}`);
          debouncedGenerateTypes();
        }
      })
      .on("unlink", (filePath) => {
        if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) {
          console.log(`\n➖ File removed: ${path.basename(filePath)}`);
          debouncedGenerateTypes();
        }
      })
      .on("addDir", (dirPath) => {
        if (dirPath === DATA_DIR) {
          console.log(`\n📁 Input directory created: ${dirPath}`);
          debouncedGenerateTypes();
        }
      })
      .on("unlinkDir", (dirPath) => {
        if (dirPath === DATA_DIR) {
          console.warn(`\n⚠️ Input directory ${DATA_DIR} removed.`);
          // Consider if types should be cleared or an error state maintained
        }
      })
      .on("error", (error) => console.error(`\n❌ Watcher error: ${error}`))
      .on("ready", () => console.log("✅ Watcher initialized and ready for changes."));

    try {
      await fs.access(DATA_DIR);
    } catch {
      console.warn(
        `\n⚠️ Input directory ${DATA_DIR} does not exist. Watching for directory creation...`,
      );
    }
  }
}

main().catch(console.error);
