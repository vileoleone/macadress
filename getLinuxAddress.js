const cp = require('node:child_process')
const util = require('node:util')

const exec = util.promisify(cp.exec)

export const getLinuxParams = async () => {
  const parsedArray = []
  const interfaceNames = await getLinuxInterfaces()
    .then(interfaces => interfaces)
    .catch(err => console.log(err))

  for (const name of interfaceNames) {
    const interfaceParams = await getLinuxSingleInterface(name)
      .then(params => params)
      .catch(err => console.log(err))

    parsedArray.push({ [name]: { macAddress: interfaceParams } })
  }
  console.log({ parsedArray })
  return parsedArray
}

const getLinuxInterfaces = async () => {
  try {
    const { stdout } = await exec('/bin/ls /sys/class/net ')

    const interfaces = stdout
      .split('\n')
      .map((iFace) => iFace.trim())
    console.log({ interfaces })
    return interfaces
  } catch (err) {
    console.error('Error:', err)
    throw err
  }
}

const getLinuxSingleInterface = async (iFace) => {
  try {
    const { stdout } = await exec(`/bin/cat /sys/class/net${iFace}/address`)

    return stdout
  } catch (err) {
    console.error('Error:', err)
    throw err
  }
}
