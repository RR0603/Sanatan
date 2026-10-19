#!/bin/sh
# Rebuild the Living Sanatan reel toolchain in a fresh container.
set -e
pip install --break-system-packages -q kokoro-onnx soundfile scipy playwright pillow numpy sherpa-onnx 2>/dev/null || true
mkdir -p /home/claude/tts /home/claude/fonts
cp "$(dirname "$0")"/fonts/*.ttf /home/claude/fonts/
[ -s /home/claude/tts/kokoro32.onnx ] || curl -sSL -o /home/claude/tts/kokoro32.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
[ -s /home/claude/tts/voices.bin ] || curl -sSL -o /home/claude/tts/voices.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
which ffmpeg >/dev/null || (apt-get install -y -q ffmpeg >/dev/null 2>&1 || pip install --break-system-packages -q imageio-ffmpeg)
echo SETUP_OK
