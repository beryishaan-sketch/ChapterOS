#!/bin/sh
set -e
cd "$(dirname "$0")"
mkdir -p www/icons
cp ../deadstop.html www/index.html
cp ../deadstop.html www/deadstop.html
cp ../manifest.webmanifest ../sw.js ../og.png www/
cp ../icons/icon-180.png ../icons/icon-192.png ../icons/icon-512.png ../icons/icon-maskable-512.png ../icons/icon-1024.png www/icons/
echo "copied game into ios-app/www"
