#!/bin/bash

if ! [ -x "$(command -v rimraf)" ]; then
  echo 'Error: rimraf not installed.' >&2
  # install rimraf globally using yarn
    yarn global add rimraf
else
    echo 'rimraf is installed'
fi

exit 0