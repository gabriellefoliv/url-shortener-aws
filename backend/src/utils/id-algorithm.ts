const map = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

let currentId = 100000; 

export function stringToBase62(inputString: string): string {
    let result = ''
    const charsToProcess = inputString.replace(/-/g, '').substring(0, 8)
    let num = parseInt(charsToProcess, 16)

    if (isNaN(num)) {
        num = Math.floor(Math.random() * 100000000)
    }

    if (num === 0) {
        return map[0]
    }

    let base62Chars: string[] = []
    
    while (num > 0) {
        base62Chars.unshift(map[num % 62]);
        num = Math.floor(num / 62);
    }
    result = base62Chars.join('')
    return result
}

export async function generateUniqueShortId(): Promise<string> {
    const uuid = crypto.randomUUID()
    console.log("UUID gerado: ", uuid)
    
    const shortId = stringToBase62(uuid)

    console.log("ID curto gerado: ", shortId)

    return shortId
}