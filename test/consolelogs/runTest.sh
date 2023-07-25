#!/usr/bin/env bash

rm -rf build
rm actual.log
../../tronbox.dev migrate --quiet > actual.log
../../tronbox.dev test