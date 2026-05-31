#!/bin/bash

# Nama default commit jika tidak diberikan
DEFAULT_MESSAGE="update"

# Gunakan argumen pertama sebagai pesan commit jika ada
COMMIT_MESSAGE=${1:-$DEFAULT_MESSAGE}

echo "🟡 Menambahkan perubahan..."
git add .

echo "🟢 Commit dengan pesan: '$COMMIT_MESSAGE'"
git commit -m "$COMMIT_MESSAGE"

echo "🔵 Push ke main..."
git push 
echo "✅ Push selesai ke branch '$CURRENT_BRANCH'"
