#!/usr/bin/env bash
# Final-quality render queue for "The Dive" (256 samples, every other frame), then web frames.
# Run from the repo root on the render PC:  bash scripts/experiences/render-final.sh
# Output PNGs: renders/_work/<scene>-final/ ; web frames: public/experiences/<name>/v1/
set -u
B="${BLENDER:-/c/Program Files/Blender Foundation/Blender 5.3/blender.exe}"
CAR="renders/_work/assets/car/SHC J-SEVEN 4-door V8.blend"
V=v1
mkdir -p renders/_work/logs
odd() { seq -s, 1 2 "$1"; }

run() {  # name script frames-list build-start build-end [extra blender args...]
  local name=$1 script=$2 frames=$3 bs=$4 be=$5; shift 5
  echo "[$(date +%T)] $name start"
  "$B" -b -P "renders/scenes/$script" -- --samples 256 --device HIP --only "$frames" \
      --out "renders/_work/$name-final" "$@" > "renders/_work/logs/$name-final.log" 2>&1
  echo "[$(date +%T)] $name render exit $? ($(ls "renders/_work/$name-final" | wc -l) frames)"
}

run pool-dive pool_dive.py "$(seq -s, 2 2 150)" 2 150
node scripts/experiences/build-frames.mjs --src renders/_work/pool-dive-final --name pool-dive --start 2 --end 150 --step 2 --version $V | tail -1
run residence residence.py "$(odd 99)" 1 99
node scripts/experiences/build-frames.mjs --src renders/_work/residence-final --name residence --start 1 --end 99 --step 2 --version $V | tail -1
run glass glass.py "$(odd 99)" 1 99
node scripts/experiences/build-frames.mjs --src renders/_work/glass-final --name glass --start 1 --end 99 --step 2 --version $V | tail -1
run grounds grounds.py "$(odd 99)" 1 99
node scripts/experiences/build-frames.mjs --src renders/_work/grounds-final --name grounds --start 1 --end 99 --step 2 --version $V | tail -1
run foam-cannon foam_cannon.py "$(odd 119)" 1 119 --model "$CAR"
node scripts/experiences/build-frames.mjs --src renders/_work/foam-cannon-final --name foam-cannon --start 1 --end 119 --step 2 --version $V | tail -1
run car-spin-clean car_spin.py "$(odd 71)" 1 71 --model "$CAR" --variant clean
node scripts/experiences/build-frames.mjs --src renders/_work/car-spin-clean-final --name car-spin --variant clean --start 1 --end 71 --step 2 --loop --version $V | tail -1
run car-spin-foam car_spin.py "$(odd 71)" 1 71 --model "$CAR" --variant foam
node scripts/experiences/build-frames.mjs --src renders/_work/car-spin-foam-final --name car-spin --variant foam --start 1 --end 71 --step 2 --loop --version $V | tail -1
echo "[$(date +%T)] ALL DONE"
