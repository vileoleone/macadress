const os = require('node:os')
const cp = require('node:child_process')
const util = require('node:util')

const exec = util.promisify(cp.exec)

const getUnixInterfaces = async () => {
  try {
    const { stdout } = await exec('ifconfig -l')

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

    console.log(iFaceResult)

    return iFaceResult
  } catch (err) {
    console.error('Error:', err)
    throw err
  }
}

const getUnixMacAdress = async () => {
    
}

const matchMacAdress = /(ether|hwaddr)+(([0-9a-f]{2}[:-]{0,1}){6})/i
