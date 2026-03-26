#!/bin/sh
set -e
# Fix /data ownership in case the Docker volume was created by root
# (common when upgrading from an older image). Runs as root before
# dropping privileges via gosu.
chown -R appuser:appuser /data
exec gosu appuser "$@"
