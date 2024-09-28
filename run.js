import { ethers } from 'ethers'; // Mengimpor ethers
import chalk from 'chalk'; // Mengimpor chalk
import fs from 'fs'; // Mengimpor fs untuk membaca file
import path from 'path'; // Mengimpor path untuk mengelola path file
import { fileURLToPath } from 'url'; // Mengimpor fileURLToPath untuk mengonversi URL

// Mendapatkan __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Memuat konfigurasi dari config.json
const configPath = path.join(__dirname, 'config.json'); // Pastikan path ke config.json benar
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')); // Membaca dan mengurai file JSON

// Fungsi untuk mendapatkan input dari pengguna
async function getInput(prompt) {
  const response = await new Promise((resolve) => {
    process.stdin.resume();
    process.stdout.write(prompt);
    process.stdin.on('data', (data) => resolve(data.toString().trim()));
  });
  return response;
}

// Fungsi untuk menghasilkan alamat acak (dummy implementation)
function generateRandomAddress() {
  return '0x' + Math.random().toString(16).slice(2, 42); // Contoh implementasi
}

async function handleTokenTransaction(network) {
  const provider = new ethers.JsonRpcProvider(network.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider); // Menggunakan privateKey dari config.json

  const tokenContractAddress = network.tokenContractAddress;
  const tokenAbi = [
    "function transfer(address to, uint amount) public returns (bool)",
    "function balanceOf(address account) public view returns (uint)"
  ];

  const tokenContract = new ethers.Contract(tokenContractAddress, tokenAbi, wallet);

  console.log(chalk.bgBlueBright("Pilih jenis penerima:"));
  console.log(chalk.hex('#7FFF00')("1: Alamat Target"));
  console.log(chalk.hex('#FF00FF')("2: Alamat Acak"));

  const recipientType = await getInput(chalk.yellow("Pilih jenis penerima (1/2) atau tekan Enter untuk default: ")) || '1';

  let recipientAddress;

  if (recipientType === '1') {
    recipientAddress = '0x10176B0CDeb398df2C6d4A6e93bE77d5DB4170f8';
    console.log(chalk.red("Alamat target yang digunakan:"));
    console.log(chalk.hex('#ed64bd')(`Alamat target yang digunakan: ${recipientAddress}`));
  } else if (recipientType === '2') {
    recipientAddress = generateRandomAddress();
    console.log(chalk.cyan(`Alamat acak yang dihasilkan: ${recipientAddress}`));
  } else {
    console.error(chalk.red("Jenis penerima tidak valid. Menggunakan alamat default."));
    recipientAddress = '0x10176B0CDeb398df2C6d4A6e93bE77d5DB4170f8';
    console.log(chalk.red(`Alamat target yang digunakan: ${recipientAddress}`));
  }

  const amount = ethers.parseUnits(await getInput(chalk.blue(`Masukkan jumlah token yang ingin dikirim (TOKEN ATAU ETH/NATIVE): `)), network.decimals);
  const targetAmount = ethers.parseUnits(await getInput(chalk.yellow('Masukkan total jumlah token yang ingin dikirim: ')), network.decimals);

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms)); // Helper untuk delay

  const { BigNumber } = ethers; // Menambahkan BigNumber
  let totalTransferred = BigNumber.from('0'); // Menggunakan BigNumber

  // Logika untuk melakukan transaksi token
  while (totalTransferred.lt(targetAmount)) {
    try {
      const tx = await tokenContract.transfer(recipientAddress, amount);
      console.log(chalk.green(`Transaksi berhasil: ${tx.hash}`));

      totalTransferred = totalTransferred.add(amount);
      console.log(chalk.yellow(`Total yang telah dikirim: ${ethers.formatUnits(totalTransferred, network.decimals)}`));

      await delay(1000); // Delay 1 detik antara transaksi
    } catch (error) {
      console.error(chalk.red(`Gagal mengirim transaksi: ${error.message}`));
      // Tunggu sebelum mencoba lagi
      await delay(5000); // Delay 5 detik
    }
  }

  console.log(chalk.green("Semua transaksi selesai!"));
}

// Fungsi utama untuk menjalankan transaksi
async function main() {
  const networkChoice = await getInput(chalk.blue("Pilih jaringan (ethereum/arbitrum/optimism/base/bsc): "));
  const network = config.networks[networkChoice];

  if (!network) {
    console.error(chalk.red("Jaringan tidak valid!"));
    return;
  }

  console.log(chalk.green(`Memulai transaksi di jaringan ${network.name}...`));
  await handleTokenTransaction(network);
}

main().catch(console.error);
