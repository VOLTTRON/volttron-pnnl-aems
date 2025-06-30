#!/bin/sh
filename=$([$# -eq 0] && echo ".env" || echo "$1")
unamestr=$(uname)
if [ "$unamestr" = 'Linux' ]; then
  export $(grep -v '^#' $filename | xargs -d '\n')
elif [ "$unamestr" = 'FreeBSD' ] || [ "$unamestr" = 'Darwin' ]; then
  export $(grep -v '^#' $filename | xargs -0)
fi