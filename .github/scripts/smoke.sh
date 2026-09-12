#!/usr/bin/env bash
# Smoke test for the built jar: start it in server mode against an empty data folder, check the
# endpoints the launcher and the UI depend on, then start it a second time against the same folder
# to prove the schema migrations are idempotent (no pending work, no stray backup). Used by CI and
# runnable locally:  .github/scripts/smoke.sh trackhounds/target/trackhounds-3.0.0.jar
set -euo pipefail

JAR="${1:?path to the jar}"
PORT="${2:-8099}"
DATA="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/trackhounds-smoke-$$"
BASE="http://127.0.0.1:$PORT"
mkdir -p "$DATA"

start() {
  java -jar "$JAR" --server "--trackhounds.port=$PORT" "--trackhounds.data-dir=$DATA" > "$DATA/run-$1.log" 2>&1 &
  PID=$!
  for _ in $(seq 1 60); do
    if curl -sf -o /dev/null "$BASE/actuator/health"; then
      return 0
    fi
    if ! kill -0 "$PID" 2>/dev/null; then
      echo "the application exited during start-up ($1)"; cat "$DATA/run-$1.log"; exit 1
    fi
    sleep 1
  done
  echo "the application did not answer on $BASE within 60 s ($1)"; cat "$DATA/run-$1.log"; exit 1
}

stop() {
  kill "$PID" 2>/dev/null || true
  wait "$PID" 2>/dev/null || true
}

expect() { # expect <label> <status> <url>
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$3")
  if [ "$code" != "$2" ]; then
    echo "$1: expected HTTP $2 from $3, got $code"; exit 1
  fi
  echo "ok  $1 ($code)"
}

start first
expect "health"                 200 "$BASE/actuator/health"
expect "app info"               200 "$BASE/app/info"
expect "UI served from the jar" 200 "$BASE/"
expect "CSV template"           200 "$BASE/dogs-template.csv"
expect "no hunt yet"            404 "$BASE/hunt"
expect "empty dog list"         200 "$BASE/dogs"
grep -q '"version":"' <(curl -s "$BASE/app/info") || { echo "app info has no version"; exit 1; }
grep -q "Successfully applied 1 migration" "$DATA/run-first.log" || { echo "V1 was not applied on the empty database"; cat "$DATA/run-first.log"; exit 1; }
stop

start second
expect "health after restart"   200 "$BASE/actuator/health"
grep -q "Schema \"main\" is up to date" "$DATA/run-second.log" || { echo "second start should find nothing pending"; cat "$DATA/run-second.log"; exit 1; }
stop

if [ -d "$DATA/backups" ] && [ -n "$(ls -A "$DATA/backups")" ]; then
  echo "no backup should be taken when nothing is pending"; ls -la "$DATA/backups"; exit 1
fi
echo "smoke test passed"
