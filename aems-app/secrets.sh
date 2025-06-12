#!/bin/sh
unamestr=$(uname)
if [ "$unamestr" = 'Linux' ]; then
  export $(grep -v '^#' .env.secrets | xargs -d '\n')
elif [ "$unamestr" = 'FreeBSD' ] || [ "$unamestr" = 'Darwin' ]; then
  export $(grep -v '^#' .env.secrets | xargs -0)
fi