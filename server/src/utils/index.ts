function useRegex(input: string) {
    let regex = /[0-9]+-[0-9]+/i;
    return regex.test(input);
}

console.log('OUT', useRegex('10-29'))