#!/bin/sh
Xvfb :99 &
export DISPLAY=:99
npm test
