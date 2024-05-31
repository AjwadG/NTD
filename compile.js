import { exec } from "child_process"; // import the child process module
import fs from "fs"; // import the file system module
import { dirname } from "path"; // import the dirname function from the path module
import { fileURLToPath } from "url"; // import the fileURLToPath function from the url module

// get the directory name of the current file
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Compiles the code using the specified compiler
 * @param {string} compiler - The compiler to use (python3, node, or g++)
 * @param {string} codeFile - The code to compile
 * @param {string} name - The name of the file to compile
 * @returns {Promise<string | Error>} The output of the compiler or an error
 */
export const compile = async (compiler, codeFile, name) => {
  let filename = ""; // initialize the filename variable
  switch (compiler) {
    case "python3": // if the compiler is python3
      filename = `${name}.py`; // set the filename to name.py
      break;
    case "node": // if the compiler is node
      filename = `${name}.js`; // set the filename to name.js
      break;
    case "g++": // if the compiler is g++
      filename = `${name}.cpp`; // set the filename to name.cpp
      break;
    default: // if the compiler is not valid
      return "Invalid compiler"; // return an error
  }
  try {
    await execPromise(`rm ${__dirname}/tmp/${name}.*`); // remove any existing files with the same name
  } catch (error) {}
  try {
    fs.writeFileSync(`${__dirname}/tmp/${filename}`, codeFile); // write the code to a file
  } catch (error) {
    console.log(error); // log any errors
    return error; // return the error
  }
  try {
    let stdout = ""; // initialize the stdout variable
    if (compiler == "g++") { // if the compiler is g++
      stdout = await execPromise(`${compiler} ${__dirname}/tmp/${filename} -o ${__dirname}/tmp/${name}.exe`); // compile the code and create an executable
      stdout = await execPromise(`${__dirname}/tmp/${name}.exe`); // run the executable
    } else { // if the compiler is not g++
      stdout = await execPromise(`${compiler} ${__dirname}/tmp/${filename}`); // compile the code
    }

    return stdout; // return the output of the compiler
  } catch (error) {
    return error; // return any errors
  }
};

/**
 * Executes a command and returns a promise that resolves with the output or rejects with an error
 * @param {string} command - The command to execute
 * @returns {Promise<string | Error>} The output of the command or an error
 */
const execPromise = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        if (command.includes('.exe') && !command.includes('g++')) {
          resolve(stdout); // if the command is an executable, resolve with the output
        } else {
          reject(stderr); // otherwise, reject with the error
        }
      } else {
        resolve(stdout); // if there is no error, resolve with the output
      }
    });
  });
};
