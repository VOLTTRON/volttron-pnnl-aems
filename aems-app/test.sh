#!/bin/sh
# build prisma
cd ./prisma
yarn lint
yarn check
yarn test:cov
# build common
cd ../common
yarn lint
yarn check
yarn test:cov
# build server
cd ../server
yarn lint
yarn check
yarn test:cov
# build client
cd ../client
yarn lint
yarn check
yarn test:cov
# return to root
cd ..