import {
  cancel,
  confirm,
  intro,
  isCancel,
  outro,
  select,
  spinner,
  text,
} from "@clack/prompts";
import fs from "fs-extra";
import path from "path";

function abort() {
  cancel("Operation cancelled.");
  process.exit(0);
}

function isEmptyDir(path: string) {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === ".git");
}

function pkgFromUserAgent(userAgent: string | undefined) {
  if (!userAgent) return undefined;
  const pkgSpec = userAgent.split(" ")[0];
  const pkgSpecArr = pkgSpec.split("/");
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  };
}

function formatProjectName(input: string) {
  const formatted = input.trim().replace(/\/+$/g, "");
  return {
    packageName: formatted.startsWith("@")
      ? formatted
      : path.basename(formatted),
    targetDir: formatted,
  };
}

function checkCancel<T>(value: unknown): T {
  if (isCancel(value)) {
    abort();
  }
  return value as T;
}

export async function main() {
  intro("Library Starter CLI 📦");

  const cwd = process.cwd();
  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  console.log("pkgInfo", pkgInfo);

  const { projectName, targetDir } = await getProjectDetails(cwd);

  const language = checkCancel<string>(
    await select({
      message: "Select language",
      options: [
        { value: "ts", label: "TypeScript" },
        { value: "js", label: "JavaScript" },
      ],
      initialValue: "ts",
    })
  );

  const bundler = checkCancel<string>(
    await select({
      message: "Select Bundling library",
      options: [{ value: "parcel", label: "parcel" }],
    })
  );

  let templateName = `${bundler}-vanilla-${language}`;

  generateProject(projectName, templateName, targetDir);
}

async function getProjectDetails(cwd: string) {
  const projectName = checkCancel<string>(
    await text({
      message: "What is the name of your project?",
      validate(value) {
        if (value.length === 0) return "Project name is required!";
        return;
      },
    })
  );

  const { targetDir, packageName } = formatProjectName(projectName);

  const distFolder = path.isAbsolute(targetDir)
    ? targetDir
    : path.join(cwd, targetDir);

  if (!fs.existsSync(distFolder)) {
    return { projectName, targetDir, distFolder, packageName };
  }

  if (!isEmptyDir(distFolder)) {
    const shouldOverride = checkCancel(
      await confirm({
        message: `"${targetDir}" already exists and is not empty. Do you want to override it?`,
      })
    );

    if (shouldOverride) {
      return { projectName, targetDir, distFolder, packageName };
    }

    return await getProjectDetails(cwd);
  }

  return { projectName, targetDir, distFolder, packageName };
}

async function generateProject(
  projectName: string,
  templateName: string,
  targetDir: string
) {
  const templatesDir = path.join(__dirname, "..", "templates");
  const templateDir = path.join(templatesDir, templateName);

  console.log("templatesDir", templatesDir);
  console.log("targetDir", targetDir);
  console.log("templateDir", templateDir);

  try {
    if (!fs.existsSync(templateDir)) {
      throw new Error(
        `Template "${templateName}" does not exist in ${templatesDir}`
      );
    }

    let spin = spinner();
    spin.start(`Generating project files for "${projectName}"...`);

    await fs.ensureDir(targetDir);

    await fs.copy(templateDir, targetDir, {
      overwrite: true,
      errorOnExist: false,
    });

    spin.stop();

    console.log(
      `Project "${projectName}" created successfully at ${targetDir}`
    );
  } catch (error: any) {
    console.error(`Error generating project: ${error.message}`);
    abort();
  }
}
