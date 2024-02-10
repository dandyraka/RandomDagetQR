import inquirer from 'inquirer';
import QRCode from 'qrcode';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';

async function generateQRCode(url) {
    const mainQRCode = await QRCode.toDataURL(url);
    const randomQRCodes = [];

    for (let i = 0; i < 5; i++) {
        const randomText = generateRandomText(44);
        const randomQRCode = await QRCode.toDataURL(randomText);
        randomQRCodes.push(randomQRCode);
    }

    return [mainQRCode, ...randomQRCodes];
}

function generateRandomText(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

async function createCombinedImage(qrCodes, mainQRPosition) {
    const canvas = createCanvas(600, 400); // Adjusted canvas size
    const ctx = canvas.getContext('2d');

    // Fill the canvas with a white background
    ctx.fillStyle = '#ffffff'; // white color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Define a grid with 2 rows and 3 columns
    const rows = 2;
    const cols = 3;

    // Calculate the size of each QR code block
    const blockSide = Math.min(canvas.width / cols, canvas.height / rows);

    // Draw the main QR code at the specified position
    const mainQRImage = await loadImage(qrCodes[0]);
    ctx.drawImage(mainQRImage, ...getPositionCoordinates(mainQRPosition, blockSide), blockSide, blockSide);

    // Draw the random QR codes in the remaining positions
    for (let i = 1; i < 6; i++) {
        const position = (mainQRPosition + i) % (rows * cols); // Use modulo to wrap around
        const randomQRImage = await loadImage(qrCodes[i]);
        ctx.drawImage(randomQRImage, ...getPositionCoordinates(position, blockSide), blockSide, blockSide);
    }

    const outputPath = 'combinedQR.png';
    const out = fs.createWriteStream(outputPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    await new Promise((resolve, reject) => {
        out.on('finish', resolve);
        out.on('error', reject);
    });
    console.log(`Combined QR codes saved to ${outputPath}`);
}

function getPositionCoordinates(position, blockSide) {
    const row = Math.floor(position / 3);
    const col = position % 3;
    const x = col * blockSide;
    const y = row * blockSide;
    return [x, y];
}

try {
    const { url } = await inquirer.prompt([
        {
            type: 'input',
            name: 'url',
            message: 'Enter URL for main QR code:',
        },
    ]);

    const { mainQRPosition } = await inquirer.prompt([
        {
            type: 'list',
            name: 'mainQRPosition',
            message: 'Choose the position for the main QR code (1-6):',
            choices: [1, 2, 3, 4, 5, 6],
        },
    ]);

    const qrCodes = await generateQRCode(url);
    await createCombinedImage(qrCodes, mainQRPosition - 1);
} catch (error) {
    console.error(error);
}