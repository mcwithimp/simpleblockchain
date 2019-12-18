import * as CryptoJS from 'crypto-js'
// yarn add --dev @types/elliptic
import { ec as EC } from 'elliptic'
// yarn add --dev @types/bs58
import * as base58 from 'bs58'
import * as fs from 'fs'
import path from 'path'

import BN from 'bn.js'

export const sha256 = (data: string): string => CryptoJS.SHA256(data).toString()

const ec = new EC('secp256k1');

const toHexBinary = (hexString: string) => CryptoJS.enc.Hex.parse(hexString)
const hexToDecimal = (hexString: string) => new BN(hexString, 'hex').toString(10)

export const sign = (sk: string, data: string): string => {
  const dataHash = sha256(data);
  const key = ec.keyFromPrivate(sk, "hex")
  const ecdsaSig = key.sign(dataHash, { canonical: true })
  const derSign = ecdsaSig.toDER()
  const signature = String(ecdsaSig.recoveryParam) + Buffer.from(derSign).toString('hex')
  return signature
}

const recoverSignatureParams = (derSignaure: string) => {
  const recoveryParam = parseInt(derSignaure.slice(0, 1))
  const sigBytes = new Uint8Array(Buffer.from(derSignaure.slice(1), 'hex'))
  const sigLength = sigBytes[1]

  if (sigLength !== sigBytes.length - 2) {
    throw new Error("Error: signature length is not valid!")
  }

  const rLength = sigBytes[3]
  const r = new BN(sigBytes.slice(4, 4 + rLength))
  const left = sigBytes.slice(4 + rLength)
  const sLength = left[1]
  const s = new BN(left.slice(2, 2 + sLength))

  return { 
    r, 
    s, 
    recoveryParam
  }
}

export const verify = (data: string, signature: string): boolean => {
  try {
    const dataHash = sha256(data)
    const ecdsaSig = recoverSignatureParams(signature)

    const pk = ec.recoverPubKey(
      hexToDecimal(dataHash),
      ecdsaSig,
      ecdsaSig.recoveryParam,
      "hex"
    )
    const pub = ec.keyFromPublic(pk, 'hex')

    const pubKey = pub.getPublic().encode('hex', false)
    console.log({ pubKey})

    return pub.verify(dataHash, ecdsaSig)
  }
  catch(e) {
    console.error(e)
    return false
  }
}

export const generateKeys = (keyName: string) => {
  const keypath = path.resolve(__dirname, './client/keys.json')
  var savedKeys = JSON.parse(fs.readFileSync(keypath).toString());

  if (savedKeys.find(x => x.alias === keyName) !== undefined) {
    console.log(`The alias '${keyName}' already exists`)
    return false
  }

  const key = ec.genKeyPair();
  const sk = key.getPrivate('hex');
  const pk = key.getPublic('hex');
  const hash = sha256(toHexBinary(pk)).toString()
  const pubKeyHash = CryptoJS.RIPEMD160(toHexBinary(hash)).toString()
  const prefixed = "00" + pubKeyHash;
  const hashed = sha256(toHexBinary(prefixed))
  const doubleHashed = sha256(toHexBinary(hashed))
  const checksum = doubleHashed.substring(0, 8)
  const rawAddress = prefixed + checksum
  const b58EncodedAddress = base58.encode(Buffer.from(rawAddress, 'hex'))

  const newKeys = {
    alias: keyName,
    sk,
    pk,
    pkh: b58EncodedAddress
  }
  savedKeys.push(newKeys)
  fs.writeFileSync(keypath, JSON.stringify(savedKeys, null, 2))

  return true
}

// For genesis dictator
// keys.json initialized as empty array []
// generateKeys("myKeys1")
