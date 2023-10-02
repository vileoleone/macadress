import cp from 'node:child_process'
import util from 'node:util'

const exec = util.promisify(cp.exec)

const keyParams = ['ether', 'inet', 'inet6']

const firstQmarkSpace = /:\s(\S+)/

export const getUnixParams = async () => {
  const parsedObject = {}
  const interfaceNames = await getUnixInterfaces()
    .then(interfaces => interfaces)
    .catch(err => console.log(err))

  for (const name of interfaceNames) {
    const interfaceParams = await getUnixSingleInterface(name)
      .then(params => params)
      .catch(err => console.log(err))

    const empty = !Object.keys(interfaceParams).length
    const hasNoMacAdress = !Object.prototype.hasOwnProperty.call(interfaceParams, 'macAdress')

    if (empty || hasNoMacAdress) continue

    parsedObject[name] = interfaceParams
  }
  return parsedObject
}

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

const getUnixSingleInterface = async (iFace) => {
  try {
    const { stdout } = await exec(`/sbin/ifconfig ${iFace}`)

    const iFaceResult = stdout

    return unixParser(iFaceResult)
  } catch (err) {
    console.error('Error:', err)
    throw err
  }
}

const unixParser = (str) => {
  const formatReturn = {}
  const lines = str.split(/\n\t|\n/)

  lines[0] = lines[0].match(firstQmarkSpace)[1]

  for (const line of lines) {
    let keyWord = line.split(/[ =:]+/)[0]

    if (keyWord === '') continue
    if (!keyParams.includes(keyWord)) continue

    let rest = line.split(keyWord)[1].trim()

    if (keyWord === 'inet') {
      keyWord = 'ipv4'
      rest = rest.split(/\s/)[0]
    }

    if (keyWord === 'inet6') {
      keyWord = 'ipv6'
      const index = rest.split(/\s/)[0].indexOf('%')
      rest = rest.split(/\s/)[0].slice(0, index)
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

export default getUnixParams
