#!/usr/bin/env bash

set -e

# Not all static files can and/or should be metabolized by the build pipeline
# For those that should not be, this script can be used to incrementally copy
# them over as needed. It includes facilities for watching for changes to the
# files over time, which makes it suitable for linked packages that are being
# actively developed.

NODE_MODULES_PATHS=(
  # "node_modules/@some/module/path"
);

exit 0

WATCH=false
VERBASE=false

function showUsage {
  echo 'Copies over node_modules files and optionally watches them for changes

Usage:

  build-node-modules.sh [-?vw]'
}

while getopts "?vw" opt; do
    case "$opt" in
    \?)
        showUsage
        exit 0
        ;;
    v)
        VERBOSE=true
        ;;
    w)
        WATCH=true
        ;;
    esac
done

shift $((OPTIND-1))

[ "${1:-}" = "--" ] && shift

if [ "$VERBOSE" = true ]; then
  set -x
fi

PACKAGE_ROOT="`dirname $(dirname $0)`"
DIST="$PACKAGE_ROOT/dist"

function ensureOutputPath {
  path=$1

  if [ -d "$path" ]; then
    directory="$path"
  else
    directory="`dirname $path`"
  fi

  echo "Creating $DIST/$directory"
  mkdir -p "$DIST/$directory"
}

function join_by { local IFS="$1"; shift; echo "$*"; }

MATCH_PATTERNS=()

echo "Performing initial copy of files to $DIST"

for path in "${NODE_MODULES_PATHS[@]}"; do
  ensureOutputPath $path

  if [ -d "${path}" ]; then
    MATCH_PATTERNS+=("$path/**/*")
    cp -r "$path"/* "$DIST/$path"
  else
    if [ -f "${path}" ]; then
      MATCH_PATTERNS+=("$path")
      cp "$path" "$DIST/$path"
    else
      echo "Path not found: $path"
      exit 1
    fi
  fi
done;

if [ "$WATCH" = true ]; then

  chokidar ${MATCH_PATTERNS[@]} -c "
echo 'chokidar_script[{event}] {path}'

if [[ '{event}' = 'change'  || '{event}' = 'add' ]]; then
  cp \"{path}\" \"$DIST/{path}\"
fi"

fi

set +x
set +e
