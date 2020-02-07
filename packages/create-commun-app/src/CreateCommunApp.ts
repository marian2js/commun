import packageJson from '../package.json'
import adminPackageJson from '../../admin/package.json'
import corePackageJson from '../../core/package.json'
import dashboardPackageJson from '../../dashboard/package.json'
import emailsPackageJson from '../../emails/package.json'
import graphqlPackageJson from '../../graphql/package.json'
import usersPackageJson from '../../users/package.json'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { SecurityUtils } from '@commun/core'
import childProcess from 'child_process'

const commander = require('commander')

const crypto = require('crypto')

const mkdir = promisify(fs.mkdir)
const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const appendFile = promisify(fs.appendFile)
const exists = promisify(fs.exists)
const stat = promisify(fs.stat)
const exec = promisify(childProcess.exec)
const generateKeyPair = promisify(crypto.generateKeyPair)

export const CreateCommunApp = async (appName: string, commandArgs: { [key: string]: string }) => {
  console.log(chalk.blue(`🏁 Setting up ${appName}...`))

  if (await exists(appName)) {
    const files = await readdir(appName)
    if (files.length) {
      console.error(chalk.red(`[ERROR] Directory ${appName} already exists and it's not empty`))
      process.exit(1)
    }
  } else {
    await mkdir(appName)
  }

  const resourcesPath = path.join(__dirname, '../resources')
  const appPath = path.join('.', appName)

  await copyDirectory(resourcesPath, appPath, '.', {
    appName,
    version: packageJson.version,
    adminVersion: adminPackageJson.version,
    coreVersion: corePackageJson.version,
    dashboardVersion: dashboardPackageJson.version,
    emailsVersion: emailsPackageJson.version,
    graphqlVersion: graphqlPackageJson.version,
    usersVersion: usersPackageJson.version,
    ...commandArgs,
  })

  await writeFile(path.join(appPath, '.env'), 'NODE_ENV=development')

  await createAccessTokenKeys(appPath)

  console.log()
  console.log(chalk.blue('📦 Installing dependencies...'))

  await exec(`cd ${appName} && npm i && git init`)

  console.log()
  console.log(chalk.greenBright('🎉 All done'))
  console.log()
  console.log('To get started run:')
  console.log(chalk.cyan(`    cd ${appName} && npm start`))
  console.log()
}

async function copyDirectory (resourcesPath: string, appPath: string, relativePath: string, replaceVars: { [key: string]: string }) {
  const currentResourcesPath = path.join(resourcesPath, relativePath)
  const currentAppPath = path.join(appPath, relativePath)
  const files = await readdir(currentResourcesPath)
  for (const file of files) {
    const currentFile = path.join(currentResourcesPath, file)
    const destFile = path.join(currentAppPath, file)

    if ((await stat(currentFile)).isDirectory()) {
      if (file !== 'resources') {
        await mkdir(destFile)
        await copyDirectory(resourcesPath, appPath, path.join(relativePath, file), replaceVars)
      }
      continue
    }

    if (replaceVars.debug) {
      console.log(chalk.cyan(`Creating ${currentFile}`))
    }

    const fileContent = (await readFile(currentFile)).toString()
    const parsedFile = parseVariables(fileContent, replaceVars)

    await writeFile(destFile, parsedFile)
  }
}

function parseVariables (text: string, replaceVars: { [key: string]: string }) {
  return text.replace(/{{([^}]+)}}/g, (_, key) => replaceVars[key])
}

async function createAccessTokenKeys (appPath: string) {
  console.log()
  console.log(chalk.blue('🔑 Generating private and public keys...'))

  const keysPath = path.join(appPath, 'keys')
  await mkdir(keysPath)

  const passphrase = await SecurityUtils.generateRandomString(48)
  const res = await generateKeyPair('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase
    }
  })
  await writeFile(path.join(keysPath, './accessToken.pub'), res.publicKey)
  await writeFile(path.join(keysPath, './accessToken.pem'), res.privateKey)

  await appendFile(path.join(appPath, '.env'), `\nCOMMUN_ACCESS_TOKEN_PK_PASSPHRASE=${passphrase}`)
}

(async () => {
  let appName: string = ''

  const program = new commander.Command()

  program
    .version(packageJson.version)
    .arguments('<app-directory>')
    .action((name: string) => {
      appName = name
    })
    .option('--dbname <dbname>', 'MongoDB database name')
    .option('--dbhost <dbname>', 'MongoDB host', 'localhost')
    .option('--dbport <dbname>', 'MongoDB port', '27017')
    .option('-d, --debug', 'output extra debugging')
    .option('-p, --port <port>', 'Port used by the server', 3000)
    .parse(process.argv)

  if (!appName) {
    console.log()
    console.error('You must specify the app directory:')
    console.log(`    ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`)
    console.log()
    process.exit(1)
  }

  const defaultArgs: { [key: string]: string } = {
    dbname: appName,
  }

  try {
    await CreateCommunApp(appName, {
      ...defaultArgs,
      ...program,
    })
  } catch (e) {
    console.log(chalk.red(`[ERROR] ${e}`))
    process.exit(1)
  }
})()
