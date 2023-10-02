const cp = require('node:child_process')
const util = require('node:util')

const exec = util.promisify(cp.exec)

const getLinuxParams = async () => {
  const parsedArray = {}
  const interfaceNames = await getLinuxInterfaces()
    .then((interfaces) => interfaces)
    .catch((err) => console.log(err))

  const interfaceIpv4 = await getLinuxInet()
    .then((ips) => ips)
    .catch((err) => console.log(err))

  for (const name of interfaceNames) {
    const interfaceParams = await getLinuxAddress(name)
      .then((params) => params)
      .catch((err) => console.log(err))

    parsedArray[name] = { macAddress: interfaceParams, ipv4: interfaceIpv4[name] }
  }
  return parsedArray
}

const getLinuxInterfaces = async () => {
  try {
    const { stdout } = await exec('/bin/ls /sys/class/net ')

    const interfaces = stdout.split('\n').filter((iFace) => iFace !== '')

    return interfaces
  } catch (err) {
    console.error('Error:', err)
    throw err
  }
}

const getLinuxAddress = async (iFace) => {
  try {
    const { stdout } = await exec(`/bin/cat /sys/class/net/${iFace}/address`)

    return stdout.trim()
  } catch (err) {
    console.error('Error:', err)
    throw err
  }
}

const getLinuxInet = async () => {
  try {
    const { stdout } = await exec('ip addr show | grep inet | grep -v inet6')

    const parsedResponse = LinuxParser(stdout)

    return parsedResponse
  } catch (err) {
    console.error('Error:', err)
    throw err
  }
}

const LinuxParser = (str) => {
  const formatReturn = {}
  const lines = str
    .split(/\n\t|\n/)
    .map((str) => str.replace("'", '').trim())
    .filter((str) => str !== '')

  lines.forEach((ipString) => {
    const ipArray = ipString.split(' ')
    const lastItem = ipArray.length - 1
    const ipv4 = ipArray[1]
    const iFaceName = ipArray[lastItem]
    formatReturn[iFaceName] = ipv4
  })

  return formatReturn
}
