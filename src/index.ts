import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prompts from 'prompts';
import kleur from 'kleur';

const defaultTargetDir = 'antlr4-project';
const cwd = process.cwd();

const renameFiles: Record<string, string | undefined> = {
  _gitignore: '.gitignore',
};

function getTargetDir(targetDir: string) {
  return targetDir?.trim().replace(/\/+$/g, '') || defaultTargetDir;
}

function copy(src: string, dest: string) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}

function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(projectName);
}

function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z\d\-~]+/g, '-');
}

function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    copy(srcFile, destFile);
  }
}

function isEmpty(path: string) {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
}

function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue;
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
  }
}

function pkgFromUserAgent(userAgent: string | undefined) {
  if (!userAgent) return undefined;
  const pkgSpec = userAgent.split(' ')[0];
  const pkgSpecArr = pkgSpec.split('/');
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  };
}

async function init() {
  let answers: prompts.Answers<'projectName' | 'overwrite' | 'packageName' | 'template'> =
    {} as any;

  let targetDir = defaultTargetDir;

  const getPackageName = () => {
    return targetDir === '.' ? path.basename(path.resolve()) : targetDir;
  };

  try {
    answers = await prompts(
      [
        {
          type: 'text',
          name: 'projectName',
          message: kleur.reset('Project name:'),
          initial: defaultTargetDir,
          onState: (state) => {
            targetDir = getTargetDir(state.value) || defaultTargetDir;
          },
        },
        {
          type: () => (fs.existsSync(targetDir) && !isEmpty(targetDir) ? 'confirm' : null),
          name: 'overwrite',
          message: () => {
            const text =
              (targetDir === '.'
                ? 'Current directory'
                : `Target directory ${kleur.underline(targetDir)}`) +
              ` is not empty. Remove existing files and continue?`;
            return kleur.reset(text);
          },
        },
        {
          type: (_, { overwrite }: { overwrite?: boolean }) => {
            if (overwrite === false) {
              throw new Error('Operation cancelled');
            }
            return null;
          },
          name: 'overwriteChecker',
        },
        {
          type: () => (isValidPackageName(getPackageName()) ? null : 'text'),
          name: 'packageName',
          message: kleur.reset('Package name:'),
          initial: () => toValidPackageName(getPackageName()),
          validate: (dir) => isValidPackageName(dir) || 'Invalid package.json name',
        },
        {
          type: 'select',
          name: 'template',
          message: kleur.reset('Select a template'),
          choices: [
            {
              title: 'Antlr4ng + Typescript (Recommended)',
              value: 'antlr4ng-typescript',
              description: 'Fully supports typescript',
            },
            {
              title: 'Antlr4 + JavaScript',
              value: 'antlr4-javascript',
              description: 'The official Antlr4 runtime',
            },
          ],
        },
      ],
      {
        onCancel: () => {
          throw new Error('Operation cancelled');
        },
      }
    );
  } catch (e: any) {
    console.error('\n' + kleur.red('✖') + ' ' + e.message);
    return;
  }

  const { overwrite, packageName, template } = answers;
  const root = path.join(cwd, targetDir);

  if (overwrite) {
    emptyDir(root);
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }

  console.log(`\nCreating project in ${root}...`);

  const templateDir = path.join(fileURLToPath(import.meta.url), '../../templates', template);

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm';

  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, renameFiles[file] ?? file);
    if (content) {
      fs.writeFileSync(targetPath, content);
    } else {
      copy(path.join(templateDir, file), targetPath);
    }
  };

  const files = fs.readdirSync(templateDir);
  files.filter((f) => f !== 'package.json').forEach((file) => write(file));

  const pkg = JSON.parse(fs.readFileSync(path.join(templateDir, `package.json`), 'utf-8'));
  pkg.name = packageName || getPackageName();
  write('package.json', JSON.stringify(pkg, null, 2) + '\n');

  const cdProjectName = path.relative(cwd, root);
  console.log(`\nDone. Now run:\n`);
  if (root !== cwd) {
    console.log(`  cd ${cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName}`);
  }
  switch (pkgManager) {
    case 'yarn':
      console.log('  yarn');
      console.log('  yarn generate');
      console.log('  yarn dev');
      break;
    default:
      console.log(`  ${pkgManager} install`);
      console.log(`  ${pkgManager} run generate`);
      console.log(`  ${pkgManager} run dev`);
      break;
  }
  console.log();
}

init();
