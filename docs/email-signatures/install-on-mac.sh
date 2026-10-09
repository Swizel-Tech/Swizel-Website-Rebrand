#!/bin/bash
# Writes a Swizel signature straight into Apple Mail, so Mail cannot strip
# the layout the way it does on copy-paste.
#
#   1. In Mail › Settings › Signatures, select (or create with +) the
#      signature you want to replace — any text in it is fine. Then quit Mail.
#   2. Run:  bash install-on-mac.sh tochukwu.html     (or contact.html)
#   3. Open Mail. The signature is locked so Mail keeps it as written.
#
# Terminal needs Full Disk Access for this (System Settings › Privacy &
# Security › Full Disk Access › Terminal).

set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="$DIR/${1:?Usage: bash install-on-mac.sh tochukwu.html | contact.html}"
[ -f "$SRC" ] || { echo "Cannot find $SRC"; exit 1; }

if pgrep -xq Mail; then
  echo "Mail is open. Quit it (Cmd+Q) and run this again."; exit 1
fi

# The signature edited most recently is the one to replace. Mail keeps them
# in iCloud Drive when Mail is synced with iCloud, otherwise in ~/Library/Mail.
TARGET=$(ls -t "$HOME"/Library/Mobile\ Documents/com~apple~mail/Data/V*/MailData/Signatures/*.mailsignature \
               "$HOME"/Library/Mail/V*/MailData/Signatures/*.mailsignature 2>/dev/null | head -1)
if [ -z "$TARGET" ]; then
  echo "No Mail signature found. Either none exists yet, or Terminal needs Full Disk Access."; exit 1
fi

echo "Replacing: $TARGET"
chflags nouchg "$TARGET" 2>/dev/null
cp "$TARGET" "$TARGET.bak" || { echo "Cannot read it — give Terminal Full Disk Access and retry."; exit 1; }

HEADERS=$(perl -0777 -ne 'print $1 if /\A(.*?)\r?\n\r?\n/s' "$TARGET")
BODY=$(perl -0777 -ne 'print $1 if /<body[^>]*>(.*)<\/body>/s' "$SRC")
[ -n "$HEADERS" ] && [ -n "$BODY" ] || { echo "Could not read the files; nothing changed."; exit 1; }

printf '%s\n\n<body style="word-wrap: break-word; -webkit-nbsp-mode: space; line-break: after-white-space;">%s</body>' "$HEADERS" "$BODY" > "$TARGET"
chflags uchg "$TARGET"
echo "Done. Open Mail and check Settings › Signatures."
echo "(Backup of the old one: $TARGET.bak — to edit this signature again later, run: chflags nouchg \"$TARGET\")"
