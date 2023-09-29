const cp = require('node:child_process')
const util = require('node:util')

const exec = util.promisify(cp.exec)

const macAdressRegex = /[A-Fa-f0-9]{2}(\-[A-Fa-f0-9]{2}){5}/
const dnsRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/
const ipv6ValidRegex = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/
const ipv4ValidRegex = /(?:^|[^.\d])((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?![.\d])/g
const ipv4AdressRegex = /IPv4\s*Address/
const ipv6AdressRegex = /IPv6\s*Address/

const getWindowsParams = async () => {
  const parsedArray = []
  await getWindowsInterfaces()
    .then(interfaces => {
      for (const paramsObj of interfaces) {
        const empty = !Object.keys(paramsObj).length
        const hasNoMacAdress = !Object.prototype.hasOwnProperty.call(paramsObj, 'macAdress')

        if (empty || hasNoMacAdress) continue
        const name = paramsObj.name
        delete paramsObj.name

        parsedArray.push({ [name]: paramsObj })
      }
    })

    .catch(err => console.log(err))

  return parsedArray
}

const getWindowsInterfaces = async (iFace) => {
  try {
    const { stdout } = await exec('ipconfig /all')
    const iFaceResult = windowsParser(stdout)

    return iFaceResult
  } catch (err) {
    console.error('Error:', err)
    throw err
  }
}

const windowsParser = (stdout) => {
  const newString = JSON.stringify(stdout).replace(/['+]/g, '')
  const newStringArray = newString.split(/\\r\\n/)
  const extractNames = []
  const cleanedArray = []
  const paramsArray = []

  const trashString = ['"', '', ' ']

  for (const line of newStringArray) {
    if (trashString.includes(line)) continue
    cleanedArray.push(line.trim())
  }

  for (const line of cleanedArray) {
    if (line.includes('.') || dnsRegex.test(line)) continue
    extractNames.push(line.replace(/[:]/g, '').trim())
  }

  let oneParam = {}

  for (const line of cleanedArray) {
    const cleanedName = line.replace(/[:]/g, '').trim()
    if (extractNames.includes(cleanedName)) {
      if (line === cleanedArray[0]) {
        oneParam.name = cleanedName
        continue
      }

      paramsArray.push(oneParam)
      oneParam = {}
      oneParam.name = cleanedName
    }

    if (macAdressRegex.test(line)) {
      const macAdress = line.match(macAdressRegex)
      oneParam.macAdress = macAdress[0]
    }
    if (ipv4AdressRegex.test(line) && ipv4ValidRegex.test(line)) {
      const ipv4 = line.match(ipv4ValidRegex)
      oneParam.ipv4 = ipv4[0]
    }
    if (ipv6AdressRegex.test(line)) {
      const ipv6 = line.match(ipv6ValidRegex)
      oneParam.ipv6 = line.slice(ipv6.index, ipv6.index + 20)
    }

    if (line === cleanedArray[cleanedArray.length - 1]) {
      paramsArray.push(oneParam)
    }
  }
  return paramsArray
}
