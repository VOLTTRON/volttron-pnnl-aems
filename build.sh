#!/bin/sh
# build prisma
cd ./prisma
rm -r ./node_modules
yarn install
yarn build
# build common
cd ../common
rm -r ./node_modules
yarn install
yarn build
# build server
cd ../server
rm -r ./node_modules
yarn install
yarn build
# build client
cd ../client
rm -r ./node_modules
yarn install
yarn build
# return to root
cd ..