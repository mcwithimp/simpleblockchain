import * as CryptoJS from 'crypto-js'
// yarn add --dev @types/elliptic
import { ec as EC } from 'elliptic'
// yarn add --dev @types/bs58
import * as base58 from 'bs58'
import * as fs from 'fs'
import path from 'path'

export const sha256 = (data: string): string => CryptoJS.SHA256(data).toString()

const ec = new EC('secp256k1');

const toHexBinary = (data: string) => CryptoJS.enc.Hex.parse(data)

export const sign = (sk: string, data : string) : string=> {
  const key = ec.keyFromPrivate(sk, "hex")
  const derSign = key.sign(data).toDER()
  const signature = Buffer.from(derSign).toString('hex')
  return signature
}

export const verify = (pk: string, data: string, signature: string) : boolean => {
  const pub = ec.keyFromPublic(pk, 'hex')
  return pub.verify(data, signature)
}

export const generateKeys = (keyName:string) => {
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

//For genesis dictator
// keys.json initialized as empty array []
// generateKeys("myKeys1")

// {
//   "alias": "myKeys1",
//   "sk": "110efe13c20b8278881fc366f64e695c6880f67a37f75eabd3fea2e7f9b6f342",
//   "pk": "04f6ccb16803516a2e5c9bbf12dcea1a802e55e51c04b915142c25c2336cf7a428a1f3cae1854a722435aa7004f517ede361e9f940f54ce091fe3273a497aa6170",
//   "pkh": "1LpUToTfVj6LVkwpyUnrFEXr3sNcdtRPkX"
// }
