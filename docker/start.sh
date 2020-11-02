#!/bin/bash
DISPLAY=:99.0
export DISPLAY
/etc/init.d/xvfb start
/etc/init.d/xvfb status
npm test
RESULT=$?
Xvfb stop
exit $RESULT