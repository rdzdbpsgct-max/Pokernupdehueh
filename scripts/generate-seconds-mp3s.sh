#!/bin/bash
# Generate Call-the-Clock seconds MP3 files via ElevenLabs API
#
# Prerequisites:
#   export ELEVENLABS_API_KEY="your-api-key"
#
# Voice IDs (from ElevenLabs):
#   German (Ava):  use the voice ID from your ElevenLabs account
#   English:       xctasy8XvGp2cVO9HL9k (or your preferred female voice)
#
# Usage:
#   ./scripts/generate-seconds-mp3s.sh
#
# This generates files like:
#   public/audio/de/seconds/seconds-10.mp3  ("10 Sekunden")
#   public/audio/en/seconds/seconds-10.mp3  ("10 seconds")
#   ... up to seconds-300.mp3

set -euo pipefail

API_KEY="${ELEVENLABS_API_KEY:?Set ELEVENLABS_API_KEY environment variable}"

# --- Configuration ---
# Set these to your ElevenLabs voice IDs
VOICE_DE="${ELEVENLABS_VOICE_DE:-}"  # German female voice (Ava)
VOICE_EN="${ELEVENLABS_VOICE_EN:-xctasy8XvGp2cVO9HL9k}"  # English female voice
MODEL="eleven_v3"
BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)/public/audio"

if [ -z "$VOICE_DE" ]; then
  echo "ERROR: Set ELEVENLABS_VOICE_DE to your German voice ID"
  echo "  Example: export ELEVENLABS_VOICE_DE=your-ava-voice-id"
  exit 1
fi

# Create output directories
mkdir -p "$BASE_DIR/de/seconds" "$BASE_DIR/en/seconds"

generate() {
  local voice_id="$1"
  local text="$2"
  local output="$3"

  if [ -f "$output" ]; then
    echo "  SKIP (exists): $output"
    return
  fi

  echo "  Generating: $output"
  curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$voice_id" \
    -H "xi-api-key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"text\": \"$text\",
      \"model_id\": \"$MODEL\",
      \"voice_settings\": {
        \"stability\": 0.75,
        \"similarity_boost\": 0.85,
        \"style\": 0.0,
        \"use_speaker_boost\": true
      }
    }" \
    --output "$output"

  # Brief pause to respect rate limits
  sleep 0.5
}

echo "=== Generating Call-the-Clock seconds MP3s ==="
echo ""

# Generate for values 10-300, step 5
for s in $(seq 10 5 300); do
  echo "[$s seconds]"
  generate "$VOICE_DE" "${s} Sekunden" "$BASE_DIR/de/seconds/seconds-${s}.mp3"
  generate "$VOICE_EN" "${s} seconds"  "$BASE_DIR/en/seconds/seconds-${s}.mp3"
done

echo ""
echo "=== Done! Generated seconds MP3s for 10-300 (step 5) ==="
echo "  DE: $BASE_DIR/de/seconds/"
echo "  EN: $BASE_DIR/en/seconds/"
echo ""
echo "Total files: $(ls "$BASE_DIR/de/seconds/"seconds-*.mp3 2>/dev/null | wc -l) DE + $(ls "$BASE_DIR/en/seconds/"seconds-*.mp3 2>/dev/null | wc -l) EN"
