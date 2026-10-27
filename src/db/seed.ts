import 'dotenv/config';

async function main() {
  console.log('No sample tasks seeded.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
