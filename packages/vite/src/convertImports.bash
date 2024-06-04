find . -type f \( -name '*.ts' -o -name '*.tsx' \) | while read file; do
  # Update imports in the file
  sed -i 's/\(import .*from \|require(\)\s*['"'"'"]\.\//\1'"'"'"\.\/\2\.js'"'"'""/g' "$file"
done