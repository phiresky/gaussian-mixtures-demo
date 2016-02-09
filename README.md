# Gaussian Mixture Model Demo

This demo runs completely client-side in the browser. The `index.html` file in the `gh-pages` branch is directly runnable. [A hosted version is available here](https://phiresky.github.io/gaussian-mixtures-demo/).

## Building

Written using [TypeScript](http://www.typescriptlang.org/) + [React](https://facebook.github.io/react/).

* Run `sudo npm -g install jspm typings` to install jspm and typings
* Run `jspm install` and `cd lib && typings install` once to get the dependencies.
* Run `tsc --watch` to build the project for development
* Run `python3 -m http.server`, then open <http://localhost:8000> for the dev server
* Run `make` to build the production version into the folder `bin` which will be checked out to the `gh-pages` branch
