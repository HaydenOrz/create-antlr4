#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const cwd = process.cwd();

const grammarPath = path.relative(
  cwd,
  path.join(fileURLToPath(import.meta.url), '../../', 'src/grammar')
);
const outputPath = path.relative(
  cwd,
  path.join(fileURLToPath(import.meta.url), '../../', 'src/gen')
);

const grammars = fs.readdirSync(grammarPath);

function compile(language) {
  const outputDir = path.join(outputPath, language);
  const grammarDir = path.join(grammarPath, language);

  if (fs.existsSync(outputDir)) {
    console.log(`\nClearing ${outputDir}/* ...`);
    console.log();
    fs.rmSync(outputDir, { recursive: true });
  }

  console.log(`Generating ${language} parser ...`);
  console.log();

  const child = spawn(
    'antlr4ng',
    [
      '-Dlanguage=TypeScript',
      '-visitor',
      '-listener',
      '-Xexact-output-dir',
      `-o`,
      outputDir,
      `${grammarDir}/*.g4`,
    ],
    {
      stdio: ['inherit', 'inherit', 'inherit'],
      cwd: process.cwd(),
      shell: true,
    }
  );

  child.on('exit', (code, signal) => {
    if (code !== null) {
      if (code === 0) {
        console.log(`Done! All generated files have been successfully output to ${outputDir}/`);
      } else {
        console.log(`Antlr generation process exited with code ${code}`);
      }
    } else if (signal) {
      console.log(`Antlr generation process killed with signal ${signal}`);
    }
  });
}

function main() {
  const lang = process.argv[2];

  if (lang === undefined) {
    grammars.forEach((language) => {
      compile(language);
    });

    return;
  }

  const supportedLanguage = grammars.find((language) => language.startsWith(lang));

  if (supportedLanguage) {
    compile(supportedLanguage);
  } else {
    console.error(`\nError: ${lang} is not found!\n`);
  }
}

main();
