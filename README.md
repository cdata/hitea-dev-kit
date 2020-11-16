## Development

### Commands

 - `npm run build` will build the full project, producing deployable artifacts
   in the `dist` folder.
 - `npm run watch` will watch all files in all relevant project directories for
   changes and build them as necessary
 - `npm run serve` will start a static web server with `dist` as the web root
 - `npm run dev` will do all three of the above things in order

### Layout

 - `static` contains files that are considered good to use as-is. These files
   are copied directly into `dist`, preserving the hierarchy within `static`
 - `scripts` contains scripts that are used in `package.json` but are too
   complex to be inlined within `package.json`
 - `styles` contains top-level CSS. Before being copied into `dist`, it will be
   run through `clean-css`, causing each stylesheet to have imports inlined and
   for the whole bundle to be minified. Each top-level CSS file in `styles` will
   be turned into a standalone bundle by the same name in `dist`.
 - `src` contains raw TypeScript sources; compiled JavaScript artifacts go to
   the `lib` folder.

Modifying the file `scripts/build-node-modules.sh` will allow you to specify
individual files and directories within `node_modules` that should be made
availabe in `dist` but should not be metabolized by the build system.
