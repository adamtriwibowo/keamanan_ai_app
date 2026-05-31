# Password Security Checker

## Overview
This script automates checking passwords against the "Have I Been Pwned" database to determine if they've been exposed in data breaches.

## Dependencies
- puppeteer-extra: Enhanced version of Puppeteer with plugin support
- puppeteer-extra-plugin-stealth: Plugin to make browser automation undetectable

## Installation
\`\`\`bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth
\`\`\`

## Usage
\`\`\`javascript
const { scrappingPassword } = require('./passwordChecker');

(async () => {
  const result = await scrappingPassword('https://haveibeenpwned.com/', 'PasswordToCheck');
  console.log(result);
})();
\`\`\`

## Function: scrappingPassword(link, password)

### Parameters
- link (string): The URL to the Have I Been Pwned website
- password (string): The password to check

### Returns
- Promise<Object>: Object containing the results of the password check

### Return Object Structure
For compromised passwords:
\`\`\`javascript
{
  title: "Oh no — pwned!",
  body: "This password has been seen X times before",
  desc: "This password has previously appeared in a data breach and should never be used. If you've ever used it anywhere before, change it immediately!"
}
\`\`\`

For secure passwords:
\`\`\`javascript
{
  title: "Good news — no pwnage found!",
  desc: "This password wasn't found in any of the Pwned Passwords loaded into Have I Been Pwned..."
}
\`\`\`

## Process Flow
1. Launches a browser with stealth mode to avoid detection
2. Navigates to haveibeenpwned.com
3. Clicks on the password check feature
4. Enters the password and submits the form
5. Extracts the results based on whether the password was found in breaches
6. Takes a screenshot and saves it to ./screenshot/{password}.png
7. Returns the data as an object

## Notes
- The script uses a proxy server from ScraperAPI
- Screenshots are saved in a ./screenshot directory (ensure this directory exists)
- The browser runs in visible mode (headless: false)
`);
