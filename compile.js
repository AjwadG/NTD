import { exec } from "child_process";
import fs from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const compile = async (compiler, codeFile) => {
  let filename = "";
  switch (compiler) {
    case "python3":
      filename = "code.py";
      break;
    case "node":
      filename = "code.js";
      break;
    case "g++":
      filename = "code.cpp";
      break;
    default:
      return "Invalid compiler";
  }
  try {
    await execPromise("rm code.*");
  } catch (error) {}
  try {
    fs.writeFileSync(`${__dirname}/${filename}`, codeFile);
  } catch (error) {
    console.log(error);
    return error;
  }
  try {
    let stdout = "";
    if (compiler == "g++") {
      stdout = await execPromise(`${compiler} ${filename} -o code.exe`);
      stdout = await execPromise(`code.exe`);
    } else {
      stdout = await execPromise(`${compiler} ${filename}`);
    }

    return stdout;
  } catch (error) {
    return error;
  }
};

const execPromise = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        if (command === "code.exe") {
          resolve(stdout);
        } else {
          reject(stderr);
        }
      } else {
        resolve(stdout);
      }
    });
  });
};
