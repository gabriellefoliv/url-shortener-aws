const map = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

let currentId = 100000; 

export function idToShortURL(n: number): string {
    let shorturl: string[] = [];
    while (n) {
        shorturl.push(map[n % 62]);
        n = Math.floor(n / 62);
    }
    shorturl.reverse();
    return shorturl.join("");
}

export async function getNextUniqueId(): Promise<string> {
    const uniqueIntId = currentId++;
    return idToShortURL(uniqueIntId);
}