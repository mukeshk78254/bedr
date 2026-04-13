set -e
echo "🔄 Starting database migration..."
if [ ! -f .env ]; then
  echo " Error: .env file not found in backend/"
  echo " Please create .env file with DATABASE_URL"
  exit 1
fi
node scripts/migrate.js
echo ""
echo " Migration completed!"
echo ""
echo "You can now start the server with: npm run dev"
