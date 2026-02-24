import { spawn } from "node:child_process";

const tasks = [
  { label: "test", command: "npm", args: ["test"] },
  { label: "lint", command: "npm", args: ["run", "lint"] },
  { label: "typecheck", command: "npm", args: ["run", "typecheck"] },
];

const verbose = process.argv.includes("--verbose");

const runTask = (task) =>
  new Promise((resolve) => {
    const child = spawn(task.command, task.args, {
      stdio: verbose ? "inherit" : ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    if (!verbose) {
      child.stdout?.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr?.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("close", (code) => {
      resolve({
        ...task,
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });

const main = async () => {
  const results = await Promise.all(tasks.map((task) => runTask(task)));

  if (!verbose) {
    for (const result of results) {
      const status = result.code === 0 ? "ok" : "fail";
      console.log(`[${status}] ${result.label}`);

      if (result.stdout.trim()) {
        console.log(result.stdout.trim());
      }

      if (result.stderr.trim()) {
        console.error(result.stderr.trim());
      }
    }
  }

  const failures = results.filter((result) => result.code !== 0);
  if (failures.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(`All checks passed in parallel (${tasks.length} tasks).`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
