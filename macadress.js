const os = require('node:os')
const cp = require('node:child_process')
const util = require('node:util')

const exec = util.promisify(cp.exec)

const keyParams = ['ether', 'inet']

const firstQmarkSpace = /:\s(\S+)/

const getUnixInterfaces = async () => {
  try {
    const { stdout } = await exec('/sbin/ifconfig -l ')

    const interfaces = stdout
      .split(/[ \t]+/)
      .map((iFace) => iFace.trim())

    return interfaces
  } catch (err) {
    console.error('Error:', err)
    throw err
  }
}

const getUnixInterface = async (iFace) => {
  try {
    const { stdout } = await exec(`/sbin/ifconfig ${iFace}`)

    const iFaceResult = stdout

    return parse(iFaceResult)
  } catch (err) {
    console.error('Error:', err)
    throw err
  }
}

const getUnixParams = async () => {
  const parsedArray = []
  const interfaceNames = await getUnixInterfaces()
    .then(interfaces => interfaces)
    .catch(err => console.log(err))

  for (const name of interfaceNames) {
    const interfaceParams = await getUnixInterface(name)
      .then(params => params)
      .catch(err => console.log(err))

    const empty = !Object.keys(interfaceParams).length
    const hasNoMacAdress = !Object.prototype.hasOwnProperty.call(interfaceParams, 'macAdress')

    console.log({ empty, hasNoMacAdress })

    if (empty || hasNoMacAdress) continue

    parsedArray.push({ [name]: interfaceParams })
  }
  console.log(parsedArray)
}

const parse = (str) => {
  const formatReturn = {}
  const lines = str.split(/\n\t|\n/)

  lines[0] = lines[0].match(firstQmarkSpace)[1]

  for (const line of lines) {
    let keyWord = line.split(/[ =:]+/)[0]

    if (keyWord === '') continue
    if (!keyParams.includes(keyWord)) continue

    let rest = line.split(keyWord)[1].trim()

    if (keyWord === 'inet') {
      keyWord = 'ip'
      rest = rest.split(/\s/)[0]
    }

    if (keyWord === 'ether') {
      keyWord = 'macAdress'
    }

    if (/^[:=]/.test(rest)) {
      rest = rest.slice(1)
    }

    formatReturn[keyWord] = rest
  }
  return formatReturn
}

const getWindowsInterfaces = async () => {
  try {
    // Use the 'ipconfig' command to get network interfaces in Windows
    const { stdout } = await exec('ipconfig')

    const interfaces = stdout
      .split('\n')
      .filter((line) => line.includes('Ethernet adapter') || line.includes('Wireless LAN adapter'))
      .map((line) => line.trim().split(':')[1])

    return interfaces
  } catch (err) {
    console.error('Error:', err)
    throw err
  }
}

// Function to get a specific network interface details in Windows
const getWindowsInterface = async (iFace) => {
  try {
    // Use the 'ipconfig /all' command to get details of all network interfaces in Windows
    const { stdout } = await exec('ipconfig /all')

    const iFaceResult = stdout.split(`\r\n${iFace}\r\n`)[1]

    return iFaceResult
  } catch (err) {
    console.error('Error:', err)
    throw err
  }
}
