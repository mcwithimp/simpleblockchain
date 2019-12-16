import * as CryptoJS from 'crypto-js'

export const sha256 = (data: string): string => CryptoJS.SHA256(data).toString()