#! /usr/bin/env bash

# Update submodules to the latest master branch

# remove submodules and install newest dependencies
[ -d ./tinlake-proxy ] && rm -rf ./tinlake-proxy
[ -d ./tinlake-actions ] && rm -rf ./tinlake-actions
[ -d ./tinlake-deploy ] && rm -rf ./tinlake-deploy
git submodule update --init --recursive
git submodule update --recursive --remote --merge
