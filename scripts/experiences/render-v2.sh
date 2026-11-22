#!/usr/bin/env bash
# The Dive v2: golden-hour re-renders (Glass, Residence, Grounds) + film finish on every frame set.
# Run from the repo root on the render PC:  bash scripts/experiences/render-v2.sh
set -u
B="${BLENDER:-/c/Program Files/Blender Foundation/Blender 5.3/blender.exe}"
V=v2
mkdir -p renders/_work/logs
odd() { seq -s, 1 2 "$1"; }
run() {  # name script frames
  echo "[$(date +%T)] $1 start"
  "$B" -b -P "renders/scenes/$2" -- --samples 256 --device HIP --only "$3" --out "renders/_work/$1-v2" > "renders/_work/logs/$1-v2.log" 2>&1
  echo "[$(date +%T)] $1 exit $? ($(ls "renders/_work/$1-v2" | wc -l) frames)"
}
build() { node scripts/experiences/build-frames.mjs --version $V "$@" | tail -1; }

run glass glass.py "$(odd 99)"
build --src renders/_work/glass-v2 --name glass --start 1 --end 99 --step 2
run residence residence.py "$(odd 99)"
build --src renders/_work/residence-v2 --name residence --start 1 --end 99 --step 2
run grounds grounds.py "$(odd 99)"
build --src renders/_work/grounds-v2 --name grounds --start 1 --end 99 --step 2
# unchanged renders, re-encoded with the film finish
build --src renders/_work/pool-dive-final --name pool-dive --start 2 --end 150 --step 2
build --src renders/_work/foam-cannon-final --name foam-cannon --start 1 --end 119 --step 2
build --src renders/_work/car-spin-clean-final --name car-spin --variant clean --start 1 --end 71 --step 2 --loop --no-grade
build --src renders/_work/car-spin-foam-final --name car-spin --variant foam --start 1 --end 71 --step 2 --loop --no-grade
echo "[$(date +%T)] ALL DONE"
