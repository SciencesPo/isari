# A word about dependencies

If you want to upgrade Angular's components in package.json, you need to know what happened when I tried to upgrade from 2.1.0 to 2.3.0

## Encountered errors

### Case 1: incomplete upgrade

When upgrading from ~2.1.0 to ~2.3.0 for `@angular/common`, `@angular/compiler` but forgetting to upgrade `@angular/core`, everything is broken with error:

> core_1.Version is not a constructor

Yes, it should not as we're only touching minor versions, too bad.

### Case 2: breaking changes

This time, `@angular/common`, `@angular/compiler` **and** `@angular/core` are upgraded from ~2.1.0 to ~2.3.0. Now build breaks with:

> can't resolve module @angular/core/src/di/opaque_token from /home/nchambrier/Projects/ScPoMedialab/isari/client/src/index.ts

NO, `client/src/index.ts` does not exist so I don't understand why there would be a module that could not be resolved from this file. Gave up.

### Case 3: upgrading angular-cli

This one occurred when trying to upgrade `angular-cli` from 1.0.0-beta.18 to 1.0.0-beta.22:

> UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 1): Error: Error encountered resolving symbol values statically. Function calls are not supported. Consider replacing the function or lambda with a reference to an exported function (position 85:19 in the original .ts file), resolving symbol AppModule in /home/nchambrier/Projects/ScPoMedialab/isari/client/src/app/app.module.ts

We did not dig this one, I guess `app.module.js` will simply need a few tweaks when `angular-cli` will be published in final version.

## Conclusion

We should not upgrade any Angular-related dependency. My advice would be to just start a new angular project from scratch (using final `angular-cli`) and drop project's sources in there, then tweak what needs to be tweaked.

We may freeze dependencies, or use Yarn to ensure the whole tree is immutable, because trust in this set of dependencies is very low now.

For the record, here is a working full dependency tree:

```
isari-ng2-frontend@1.0.0
├── @angular/common@2.1.2
├── @angular/compiler@2.1.2
├── @angular/core@2.1.2
├── @angular/forms@2.1.2
├── @angular/http@2.1.2
├─┬ @angular/material@2.0.0-alpha.10
│ └── @types/hammerjs@2.0.33
├── @angular/platform-browser@2.1.2
├── @angular/platform-browser-dynamic@2.1.2
├── @angular/router@3.2.4
├── @types/jasmine@2.5.38
├── @types/node@6.0.52
├─┬ angular-cli@1.0.0-beta.18
│ ├── @angular-cli/ast-tools@1.0.10
│ ├── @angular-cli/base-href-webpack@1.0.9
│ ├─┬ UNMET PEER DEPENDENCY @angular/compiler-cli@2.1.2
│ │ └── reflect-metadata@0.1.8
│ ├── @angular/platform-server@2.1.2
│ ├─┬ @angular/tsc-wrapped@0.3.0
│ │ └─┬ tsickle@0.1.7
│ │   └─┬ source-map-support@0.3.3
│ │     └── source-map@0.1.32
│ ├─┬ @ngtools/webpack@1.1.9
│ │ ├─┬ magic-string@0.16.0
│ │ │ └── vlq@0.2.1
│ │ └── source-map@0.5.6
│ ├─┬ angular2-template-loader@0.5.0
│ │ ├─┬ codecov@1.0.1
│ │ │ ├── argv@0.0.2
│ │ │ ├─┬ execSync@1.0.2
│ │ │ │ └─┬ temp@0.5.1
│ │ │ │   └─┬ rimraf@2.1.4
│ │ │ │     └── graceful-fs@1.2.3
│ │ │ └── urlgrey@0.4.4
│ │ └─┬ loader-utils@0.2.16
│ │   ├── big.js@3.1.3
│ │   ├── emojis-list@2.1.0
│ │   └── json5@0.5.1
│ ├─┬ awesome-typescript-loader@2.2.4
│ │ ├── object-assign@4.1.0
│ │ └─┬ source-map-support@0.4.6
│ │   └── source-map@0.5.6
│ ├─┬ chalk@1.1.3
│ │ ├── ansi-styles@2.2.1
│ │ ├─┬ has-ansi@2.0.0
│ │ │ └── ansi-regex@2.0.0
│ │ ├── strip-ansi@3.0.1
│ │ └── supports-color@2.0.0
│ ├─┬ common-tags@1.4.0
│ │ └─┬ babel-runtime@6.20.0
│ │   └── regenerator-runtime@0.10.1
│ ├─┬ compression-webpack-plugin@0.3.2
│ │ ├── async@0.2.10
│ │ ├─┬ node-zopfli@2.0.2
│ │ │ ├─┬ commander@2.9.0
│ │ │ │ └── graceful-readlink@1.0.1
│ │ │ ├── defaults@1.0.3
│ │ │ └─┬ node-pre-gyp@0.6.32
│ │ │   ├── rc@1.1.6
│ │ │   └─┬ tar-pack@3.3.0
│ │ │     ├── fstream-ignore@1.0.5
│ │ │     ├── once@1.3.3
│ │ │     ├── readable-stream@2.1.5
│ │ │     └── uid-number@0.0.6
│ │ └─┬ webpack-sources@0.1.3
│ │   └── source-map@0.5.6
│ ├─┬ css-loader@0.23.1
│ │ ├─┬ css-selector-tokenizer@0.5.4
│ │ │ ├── cssesc@0.1.0
│ │ │ └── fastparse@1.1.1
│ │ ├─┬ cssnano@3.9.1
│ │ │ ├─┬ autoprefixer@6.5.4
│ │ │ │ ├── browserslist@1.4.0
│ │ │ │ ├── caniuse-db@1.0.30000597
│ │ │ │ ├── normalize-range@0.1.2
│ │ │ │ └── num2fraction@1.2.2
│ │ │ ├── decamelize@1.2.0
│ │ │ ├── defined@1.0.0
│ │ │ ├── has@1.0.1
│ │ │ ├─┬ postcss-calc@5.3.1
│ │ │ │ ├── postcss-message-helpers@2.0.0
│ │ │ │ └─┬ reduce-css-calc@1.3.0
│ │ │ │   ├─┬ math-expression-evaluator@1.2.14
│ │ │ │   │ └── lodash.indexof@4.0.5
│ │ │ │   └── reduce-function-call@1.0.2
│ │ │ ├─┬ postcss-colormin@2.2.1
│ │ │ │ └─┬ colormin@1.1.2
│ │ │ │   ├─┬ color@0.11.4
│ │ │ │   │ ├─┬ color-convert@1.8.2
│ │ │ │   │ │ └── color-name@1.1.1
│ │ │ │   │ └── color-string@0.3.0
│ │ │ │   └── css-color-names@0.0.4
│ │ │ ├── postcss-convert-values@2.5.0
│ │ │ ├── postcss-discard-comments@2.0.4
│ │ │ ├── postcss-discard-duplicates@2.0.2
│ │ │ ├── postcss-discard-empty@2.1.0
│ │ │ ├── postcss-discard-overridden@0.1.1
│ │ │ ├─┬ postcss-discard-unused@2.2.3
│ │ │ │ └── uniqs@2.0.0
│ │ │ ├─┬ postcss-filter-plugins@2.0.2
│ │ │ │ └─┬ uniqid@4.1.0
│ │ │ │   └── macaddress@0.2.8
│ │ │ ├── postcss-merge-idents@2.1.7
│ │ │ ├── postcss-merge-longhand@2.0.1
│ │ │ ├─┬ postcss-merge-rules@2.0.11
│ │ │ │ └── vendors@1.0.1
│ │ │ ├── postcss-minify-font-values@1.0.5
│ │ │ ├── postcss-minify-gradients@1.0.5
│ │ │ ├─┬ postcss-minify-params@1.0.5
│ │ │ │ └── alphanum-sort@1.0.2
│ │ │ ├─┬ postcss-minify-selectors@2.0.7
│ │ │ │ └─┬ postcss-selector-parser@2.2.2
│ │ │ │   ├── flatten@1.0.2
│ │ │ │   ├── indexes-of@1.0.1
│ │ │ │   └── uniq@1.0.1
│ │ │ ├── postcss-normalize-charset@1.1.1
│ │ │ ├─┬ postcss-normalize-url@3.0.7
│ │ │ │ ├── is-absolute-url@2.1.0
│ │ │ │ └─┬ normalize-url@1.8.0
│ │ │ │   ├── prepend-http@1.0.4
│ │ │ │   ├─┬ query-string@4.2.3
│ │ │ │   │ └── strict-uri-encode@1.1.0
│ │ │ │   └─┬ sort-keys@1.1.2
│ │ │ │     └── is-plain-obj@1.1.0
│ │ │ ├── postcss-ordered-values@2.2.2
│ │ │ ├── postcss-reduce-idents@2.3.1
│ │ │ ├── postcss-reduce-initial@1.0.0
│ │ │ ├── postcss-reduce-transforms@1.0.4
│ │ │ ├─┬ postcss-svgo@2.1.5
│ │ │ │ ├─┬ is-svg@2.1.0
│ │ │ │ │ └── html-comment-regex@1.1.1
│ │ │ │ └─┬ svgo@0.7.1
│ │ │ │   ├── coa@1.0.1
│ │ │ │   ├─┬ csso@2.2.1
│ │ │ │   │ ├── clap@1.1.2
│ │ │ │   │ └── source-map@0.5.6
│ │ │ │   ├── sax@1.2.1
│ │ │ │   └── whet.extend@0.9.9
│ │ │ ├── postcss-unique-selectors@2.0.2
│ │ │ ├── postcss-value-parser@3.3.0
│ │ │ └── postcss-zindex@2.2.0
│ │ ├─┬ lodash.camelcase@3.0.1
│ │ │ └─┬ lodash._createcompounder@3.0.0
│ │ │   ├─┬ lodash.deburr@3.2.0
│ │ │   │ └── lodash._root@3.0.1
│ │ │   └── lodash.words@3.2.0
│ │ ├─┬ postcss@5.2.6
│ │ │ ├── js-base64@2.1.9
│ │ │ ├── source-map@0.5.6
│ │ │ └── supports-color@3.1.2
│ │ ├── postcss-modules-extract-imports@1.0.1
│ │ ├─┬ postcss-modules-local-by-default@1.1.1
│ │ │ └─┬ css-selector-tokenizer@0.6.0
│ │ │   └─┬ regexpu-core@1.0.0
│ │ │     ├── regenerate@1.3.2
│ │ │     ├── regjsgen@0.2.0
│ │ │     └─┬ regjsparser@0.1.5
│ │ │       └── jsesc@0.5.0
│ │ ├─┬ postcss-modules-scope@1.0.2
│ │ │ └── css-selector-tokenizer@0.6.0
│ │ ├─┬ postcss-modules-values@1.2.2
│ │ │ └── icss-replace-symbols@1.0.2
│ │ └── source-list-map@0.1.7
│ ├── denodeify@1.2.1
│ ├─┬ ember-cli@2.5.0
│ │ ├─┬ amd-name-resolver@0.0.5
│ │ │ └── ensure-posix-path@1.0.2
│ │ ├── bower@1.8.0
│ │ ├─┬ bower-config@1.4.0
│ │ │ ├── graceful-fs@4.1.11
│ │ │ ├── mout@1.0.0
│ │ │ ├─┬ osenv@0.1.4
│ │ │ │ └── os-homedir@1.0.2
│ │ │ └── untildify@2.1.0
│ │ ├── bower-endpoint-parser@0.2.2
│ │ ├─┬ broccoli-babel-transpiler@5.6.1
│ │ │ ├─┬ babel-core@5.8.38
│ │ │ │ ├── babel-plugin-constant-folding@1.0.1
│ │ │ │ ├── babel-plugin-dead-code-elimination@1.0.2
│ │ │ │ ├── babel-plugin-eval@1.0.1
│ │ │ │ ├── babel-plugin-inline-environment-variables@1.0.1
│ │ │ │ ├── babel-plugin-jscript@1.0.4
│ │ │ │ ├── babel-plugin-member-expression-literals@1.0.1
│ │ │ │ ├── babel-plugin-property-literals@1.0.1
│ │ │ │ ├─┬ babel-plugin-proto-to-assign@1.0.4
│ │ │ │ │ └── lodash@3.10.1
│ │ │ │ ├── babel-plugin-react-constant-elements@1.0.3
│ │ │ │ ├── babel-plugin-react-display-name@1.0.3
│ │ │ │ ├── babel-plugin-remove-console@1.0.1
│ │ │ │ ├── babel-plugin-remove-debugger@1.0.1
│ │ │ │ ├── babel-plugin-runtime@1.0.7
│ │ │ │ ├─┬ babel-plugin-undeclared-variables-check@1.0.2
│ │ │ │ │ └── leven@1.0.2
│ │ │ │ ├── babel-plugin-undefined-to-void@1.1.6
│ │ │ │ ├── babylon@5.8.38
│ │ │ │ ├── bluebird@2.11.0
│ │ │ │ ├── convert-source-map@1.3.0
│ │ │ │ ├── core-js@1.2.7
│ │ │ │ ├── detect-indent@3.0.1
│ │ │ │ ├── fs-readdir-recursive@0.1.2
│ │ │ │ ├── globals@6.4.1
│ │ │ │ ├─┬ home-or-tmp@1.0.0
│ │ │ │ │ └── user-home@1.1.1
│ │ │ │ ├─┬ is-integer@1.0.6
│ │ │ │ │ └── is-finite@1.0.2
│ │ │ │ ├── js-tokens@1.0.1
│ │ │ │ ├── json5@0.4.0
│ │ │ │ ├── lodash@3.10.1
│ │ │ │ ├── minimatch@2.0.10
│ │ │ │ ├─┬ output-file-sync@1.1.2
│ │ │ │ │ └── graceful-fs@4.1.11
│ │ │ │ ├── path-exists@1.0.0
│ │ │ │ ├── private@0.1.6
│ │ │ │ ├─┬ regenerator@0.8.40
│ │ │ │ │ ├─┬ commoner@0.10.8
│ │ │ │ │ │ ├── detective@4.3.2
│ │ │ │ │ │ ├── glob@5.0.15
│ │ │ │ │ │ ├── graceful-fs@4.1.11
│ │ │ │ │ │ ├── iconv-lite@0.4.15
│ │ │ │ │ │ └─┬ recast@0.11.18
│ │ │ │ │ │   ├── esprima@3.1.2
│ │ │ │ │ │   └── source-map@0.5.6
│ │ │ │ │ ├─┬ defs@1.1.1
│ │ │ │ │ │ ├─┬ alter@0.2.0
│ │ │ │ │ │ │ └── stable@0.1.5
│ │ │ │ │ │ ├── ast-traverse@0.1.1
│ │ │ │ │ │ ├── breakable@1.0.0
│ │ │ │ │ │ ├── esprima-fb@15001.1001.0-dev-harmony-fb
│ │ │ │ │ │ ├── simple-fmt@0.1.0
│ │ │ │ │ │ ├── simple-is@0.2.0
│ │ │ │ │ │ ├── stringmap@0.2.2
│ │ │ │ │ │ ├── stringset@0.2.1
│ │ │ │ │ │ ├── tryor@0.1.2
│ │ │ │ │ │ └─┬ yargs@3.27.0
│ │ │ │ │ │   └── window-size@0.1.4
│ │ │ │ │ ├── esprima-fb@15001.1001.0-dev-harmony-fb
│ │ │ │ │ └─┬ recast@0.10.33
│ │ │ │ │   ├── ast-types@0.8.12
│ │ │ │ │   ├── esprima-fb@15001.1001.0-dev-harmony-fb
│ │ │ │ │   └── source-map@0.5.6
│ │ │ │ ├── regexpu@1.3.0
│ │ │ │ ├── repeating@1.1.3
│ │ │ │ ├── shebang-regex@1.0.0
│ │ │ │ ├── slash@1.0.0
│ │ │ │ ├── source-map@0.5.6
│ │ │ │ ├─┬ source-map-support@0.2.10
│ │ │ │ │ └── source-map@0.1.32
│ │ │ │ ├── to-fast-properties@1.0.2
│ │ │ │ ├── trim-right@1.0.1
│ │ │ │ └── try-resolve@1.0.1
│ │ │ ├─┬ broccoli-persistent-filter@1.2.11
│ │ │ │ ├─┬ async-disk-cache@1.0.9
│ │ │ │ │ └─┬ istextorbinary@2.1.0
│ │ │ │ │   ├── binaryextensions@2.0.0
│ │ │ │ │   ├── editions@1.3.3
│ │ │ │ │   └── textextensions@2.0.1
│ │ │ │ ├── fs-tree-diff@0.5.5
│ │ │ │ ├─┬ md5-hex@1.3.0
│ │ │ │ │ └── md5-o-matic@0.1.1
│ │ │ │ └── walk-sync@0.3.1
│ │ │ ├── clone@0.2.0
│ │ │ ├── hash-for-dep@1.0.3
│ │ │ └── json-stable-stringify@1.0.1
│ │ ├─┬ broccoli-concat@2.3.8
│ │ │ ├─┬ broccoli-caching-writer@2.3.1
│ │ │ │ ├─┬ broccoli-kitchen-sink-helpers@0.2.9
│ │ │ │ │ └── glob@5.0.15
│ │ │ │ └── broccoli-plugin@1.1.0
│ │ │ ├─┬ broccoli-stew@1.4.0
│ │ │ │ └── walk-sync@0.3.1
│ │ │ ├─┬ fast-sourcemap-concat@1.1.0
│ │ │ │ ├─┬ chalk@0.5.1
│ │ │ │ │ ├── ansi-styles@1.1.0
│ │ │ │ │ ├─┬ has-ansi@0.1.0
│ │ │ │ │ │ └── ansi-regex@0.2.1
│ │ │ │ │ ├── strip-ansi@0.3.0
│ │ │ │ │ └── supports-color@0.2.0
│ │ │ │ ├─┬ memory-streams@0.1.0
│ │ │ │ │ └─┬ readable-stream@1.0.34
│ │ │ │ │   └── isarray@0.0.1
│ │ │ │ └── source-map-url@0.3.0
│ │ │ ├── lodash.merge@4.6.0
│ │ │ ├── lodash.omit@4.5.0
│ │ │ └── lodash.uniq@4.5.0
│ │ ├── broccoli-config-loader@1.0.0
│ │ ├─┬ broccoli-config-replace@1.1.2
│ │ │ └─┬ fs-extra@0.24.0
│ │ │   └── graceful-fs@4.1.11
│ │ ├─┬ broccoli-funnel@1.1.0
│ │ │ ├── array-equal@1.0.0
│ │ │ ├── blank-object@1.0.2
│ │ │ ├── exists-sync@0.0.4
│ │ │ ├── fast-ordered-set@1.0.3
│ │ │ ├── fs-tree-diff@0.5.5
│ │ │ ├─┬ heimdalljs@0.2.3
│ │ │ │ └── rsvp@3.2.1
│ │ │ ├── path-posix@1.0.0
│ │ │ └── walk-sync@0.3.1
│ │ ├── broccoli-funnel-reducer@1.0.0
│ │ ├─┬ broccoli-kitchen-sink-helpers@0.3.1
│ │ │ └── glob@5.0.15
│ │ ├─┬ broccoli-merge-trees@1.2.1
│ │ │ ├── can-symlink@1.0.0
│ │ │ ├── fs-tree-diff@0.5.5
│ │ │ └── heimdalljs-logger@0.1.7
│ │ ├── broccoli-plugin@1.3.0
│ │ ├─┬ broccoli-sane-watcher@1.1.5
│ │ │ └── broccoli-slow-trees@1.1.0
│ │ ├── broccoli-source@1.1.0
│ │ ├── broccoli-viz@2.0.1
│ │ ├── clean-base-url@1.0.0
│ │ ├─┬ compression@1.6.2
│ │ │ ├─┬ accepts@1.3.3
│ │ │ │ └── negotiator@0.6.1
│ │ │ ├── bytes@2.3.0
│ │ │ ├── compressible@2.0.9
│ │ │ ├── on-headers@1.0.1
│ │ │ └── vary@1.1.0
│ │ ├─┬ configstore@2.1.0
│ │ │ ├─┬ dot-prop@3.0.0
│ │ │ │ └── is-obj@1.0.1
│ │ │ ├── graceful-fs@4.1.11
│ │ │ ├── uuid@2.0.3
│ │ │ ├─┬ write-file-atomic@1.2.0
│ │ │ │ ├── graceful-fs@4.1.11
│ │ │ │ ├── imurmurhash@0.1.4
│ │ │ │ └── slide@1.1.6
│ │ │ └── xdg-basedir@2.0.0
│ │ ├─┬ core-object@0.0.2
│ │ │ └── lodash-node@2.4.1
│ │ ├─┬ cpr@0.4.2
│ │ │ ├── graceful-fs@4.1.11
│ │ │ └─┬ rimraf@2.4.5
│ │ │   └── glob@6.0.4
│ │ ├─┬ debug@2.2.0
│ │ │ └── ms@0.7.1
│ │ ├─┬ ember-cli-broccoli@0.16.9
│ │ │ ├─┬ broccoli-kitchen-sink-helpers@0.2.9
│ │ │ │ └── glob@5.0.15
│ │ │ └── copy-dereference@1.0.0
│ │ ├── ember-cli-get-component-path-option@1.0.0
│ │ ├── ember-cli-is-package-missing@1.0.0
│ │ ├── ember-cli-normalize-entity-name@1.0.0
│ │ ├── ember-cli-path-utils@1.0.0
│ │ ├─┬ ember-cli-preprocess-registry@2.0.0
│ │ │ ├─┬ broccoli-clean-css@1.1.0
│ │ │ │ ├─┬ clean-css-promise@0.1.1
│ │ │ │ │ └─┬ array-to-error@1.1.1
│ │ │ │ │   └── array-to-sentence@1.1.0
│ │ │ │ └─┬ inline-source-map-comment@1.0.5
│ │ │ │   └── sum-up@1.0.3
│ │ │ ├── lodash@3.10.1
│ │ │ └── process-relative-require@1.0.0
│ │ ├── ember-cli-test-info@1.0.0
│ │ ├── ember-cli-valid-component-name@1.0.0
│ │ ├─┬ ember-router-generator@1.2.2
│ │ │ └─┬ recast@0.11.18
│ │ │   ├── ast-types@0.9.2
│ │ │   ├── esprima@3.1.2
│ │ │   └── source-map@0.5.6
│ │ ├── exists-sync@0.0.3
│ │ ├─┬ express@4.14.0
│ │ │ ├── array-flatten@1.1.1
│ │ │ ├── content-disposition@0.5.1
│ │ │ ├── cookie@0.3.1
│ │ │ ├── cookie-signature@1.0.6
│ │ │ ├── encodeurl@1.0.1
│ │ │ ├── escape-html@1.0.3
│ │ │ ├── etag@1.7.0
│ │ │ ├── fresh@0.3.0
│ │ │ ├── merge-descriptors@1.0.1
│ │ │ ├── methods@1.1.2
│ │ │ ├── path-to-regexp@0.1.7
│ │ │ ├─┬ proxy-addr@1.1.2
│ │ │ │ ├── forwarded@0.1.0
│ │ │ │ └── ipaddr.js@1.1.1
│ │ │ ├── qs@6.2.0
│ │ │ ├── range-parser@1.2.0
│ │ │ ├─┬ send@0.14.1
│ │ │ │ └── destroy@1.0.4
│ │ │ └── serve-static@1.11.1
│ │ ├── filesize@3.3.0
│ │ ├─┬ findup@0.1.5
│ │ │ ├── colors@0.6.2
│ │ │ └── commander@2.1.0
│ │ ├─┬ findup-sync@0.2.1
│ │ │ └─┬ glob@4.3.5
│ │ │   └── minimatch@2.0.10
│ │ ├─┬ fs-extra@0.26.7
│ │ │ └── graceful-fs@4.1.11
│ │ ├── fs-monitor-stack@1.1.1
│ │ ├── fs-tree-diff@0.4.4
│ │ ├── get-caller-file@1.0.2
│ │ ├── git-repo-info@1.3.1
│ │ ├── glob@7.0.3
│ │ ├── inflection@1.10.0
│ │ ├─┬ inquirer@0.12.0
│ │ │ ├── ansi-escapes@1.4.0
│ │ │ ├─┬ cli-cursor@1.0.2
│ │ │ │ └─┬ restore-cursor@1.0.1
│ │ │ │   ├── exit-hook@1.1.1
│ │ │ │   └── onetime@1.1.0
│ │ │ ├── cli-width@2.1.0
│ │ │ ├── figures@1.7.0
│ │ │ ├─┬ readline2@1.0.1
│ │ │ │ ├── code-point-at@1.1.0
│ │ │ │ ├─┬ is-fullwidth-code-point@1.0.0
│ │ │ │ │ └── number-is-nan@1.0.1
│ │ │ │ └── mute-stream@0.0.5
│ │ │ ├── run-async@0.1.0
│ │ │ ├── rx-lite@3.1.2
│ │ │ └── string-width@1.0.2
│ │ ├── is-git-url@0.2.3
│ │ ├── isbinaryfile@2.0.4
│ │ ├─┬ markdown-it@4.3.0
│ │ │ ├── argparse@1.0.9
│ │ │ ├── entities@1.1.1
│ │ │ ├── linkify-it@1.2.4
│ │ │ ├── mdurl@1.0.1
│ │ │ └── uc.micro@1.0.3
│ │ ├─┬ markdown-it-terminal@0.0.3
│ │ │ ├─┬ cardinal@0.5.0
│ │ │ │ ├── ansicolors@0.2.1
│ │ │ │ └─┬ redeyed@0.5.0
│ │ │ │   └── esprima-fb@12001.1.0-dev-harmony-fb
│ │ │ ├─┬ cli-table@0.3.1
│ │ │ │ └── colors@1.0.3
│ │ │ ├── lodash.merge@3.3.2
│ │ │ └── markdown-it@4.4.0
│ │ ├─┬ merge-defaults@0.2.1
│ │ │ └── lodash@2.4.2
│ │ ├─┬ morgan@1.7.0
│ │ │ └── basic-auth@1.0.4
│ │ ├── node-modules-path@1.0.1
│ │ ├── node-uuid@1.4.7
│ │ ├── nopt@3.0.6
│ │ ├─┬ npm@2.14.21
│ │ │ ├── abbrev@1.0.7
│ │ │ ├── ansi@0.3.1
│ │ │ ├── ansi-regex@2.0.0
│ │ │ ├── ansicolors@0.3.2
│ │ │ ├── ansistyles@0.1.3
│ │ │ ├── archy@1.0.0
│ │ │ ├── async-some@1.0.2
│ │ │ ├── block-stream@0.0.8
│ │ │ ├── char-spinner@1.0.1
│ │ │ ├── chmodr@1.0.2
│ │ │ ├── chownr@1.0.1
│ │ │ ├── cmd-shim@2.0.2
│ │ │ ├─┬ columnify@1.5.4
│ │ │ │ └─┬ wcwidth@1.0.0
│ │ │ │   └─┬ defaults@1.0.3
│ │ │ │     └── clone@1.0.2
│ │ │ ├─┬ config-chain@1.1.10
│ │ │ │ └── proto-list@1.2.4
│ │ │ ├─┬ dezalgo@1.0.3
│ │ │ │ └── asap@2.0.3
│ │ │ ├── editor@1.0.0
│ │ │ ├── fs-vacuum@1.2.7
│ │ │ ├─┬ fs-write-stream-atomic@1.0.8
│ │ │ │ └── iferr@0.1.5
│ │ │ ├── fstream@1.0.8
│ │ │ ├─┬ fstream-npm@1.0.7
│ │ │ │ └── fstream-ignore@1.0.3
│ │ │ ├── github-url-from-git@1.4.0
│ │ │ ├── github-url-from-username-repo@1.0.2
│ │ │ ├─┬ glob@5.0.15
│ │ │ │ └── path-is-absolute@1.0.0
│ │ │ ├── graceful-fs@4.1.3
│ │ │ ├── hosted-git-info@2.1.4
│ │ │ ├── imurmurhash@0.1.4
│ │ │ ├── inflight@1.0.4
│ │ │ ├── inherits@2.0.1
│ │ │ ├── ini@1.3.4
│ │ │ ├─┬ init-package-json@1.9.3
│ │ │ │ ├─┬ glob@6.0.4
│ │ │ │ │ └── path-is-absolute@1.0.0
│ │ │ │ └── promzard@0.3.0
│ │ │ ├── lockfile@1.0.1
│ │ │ ├─┬ lru-cache@3.2.0
│ │ │ │ └── pseudomap@1.0.1
│ │ │ ├─┬ minimatch@3.0.0
│ │ │ │ └─┬ brace-expansion@1.1.1
│ │ │ │   ├── balanced-match@0.2.1
│ │ │ │   └── concat-map@0.0.1
│ │ │ ├─┬ mkdirp@0.5.1
│ │ │ │ └── minimist@0.0.8
│ │ │ ├─┬ node-gyp@3.3.0
│ │ │ │ ├─┬ glob@4.5.3
│ │ │ │ │ └─┬ minimatch@2.0.10
│ │ │ │ │   └─┬ brace-expansion@1.1.3
│ │ │ │ │     ├── balanced-match@0.3.0
│ │ │ │ │     └── concat-map@0.0.1
│ │ │ │ ├─┬ minimatch@1.0.0
│ │ │ │ │ ├── lru-cache@2.7.3
│ │ │ │ │ └── sigmund@1.0.1
│ │ │ │ └─┬ path-array@1.0.1
│ │ │ │   └─┬ array-index@1.0.0
│ │ │ │     ├─┬ debug@2.2.0
│ │ │ │     │ └── ms@0.7.1
│ │ │ │     └─┬ es6-symbol@3.0.2
│ │ │ │       ├── d@0.1.1
│ │ │ │       └─┬ es5-ext@0.10.11
│ │ │ │         └── es6-iterator@2.0.0
│ │ │ ├── nopt@3.0.6
│ │ │ ├── normalize-git-url@3.0.1
│ │ │ ├─┬ normalize-package-data@2.3.5
│ │ │ │ └─┬ is-builtin-module@1.0.0
│ │ │ │   └── builtin-modules@1.1.0
│ │ │ ├── npm-cache-filename@1.0.2
│ │ │ ├── npm-install-checks@1.0.7
│ │ │ ├── npm-package-arg@4.1.0
│ │ │ ├─┬ npm-registry-client@7.0.9
│ │ │ │ ├─┬ concat-stream@1.5.1
│ │ │ │ │ ├─┬ readable-stream@2.0.4
│ │ │ │ │ │ ├── core-util-is@1.0.2
│ │ │ │ │ │ ├── isarray@0.0.1
│ │ │ │ │ │ ├── process-nextick-args@1.0.6
│ │ │ │ │ │ ├── string_decoder@0.10.31
│ │ │ │ │ │ └── util-deprecate@1.0.2
│ │ │ │ │ └── typedarray@0.0.6
│ │ │ │ └── retry@0.8.0
│ │ │ ├── npm-user-validate@0.1.2
│ │ │ ├─┬ npmlog@2.0.2
│ │ │ │ ├─┬ are-we-there-yet@1.0.6
│ │ │ │ │ └── delegates@1.0.0
│ │ │ │ └─┬ gauge@1.2.5
│ │ │ │   ├── has-unicode@2.0.0
│ │ │ │   ├─┬ lodash.pad@3.2.2
│ │ │ │   │ └─┬ lodash.repeat@3.2.0
│ │ │ │   │   └── lodash._root@3.0.1
│ │ │ │   ├─┬ lodash.padleft@3.1.1
│ │ │ │   │ ├── lodash._basetostring@3.0.1
│ │ │ │   │ └── lodash._createpadding@3.6.1
│ │ │ │   └── lodash.padright@3.1.1
│ │ │ ├── once@1.3.3
│ │ │ ├── opener@1.4.1
│ │ │ ├─┬ osenv@0.1.3
│ │ │ │ ├── os-homedir@1.0.0
│ │ │ │ └── os-tmpdir@1.0.1
│ │ │ ├── path-is-inside@1.0.1
│ │ │ ├─┬ read@1.0.7
│ │ │ │ └── mute-stream@0.0.5
│ │ │ ├─┬ read-installed@4.0.3
│ │ │ │ ├── debuglog@1.0.1
│ │ │ │ ├── readdir-scoped-modules@1.0.2
│ │ │ │ └── util-extend@1.0.1
│ │ │ ├─┬ read-package-json@2.0.3
│ │ │ │ ├─┬ glob@6.0.4
│ │ │ │ │ └── path-is-absolute@1.0.0
│ │ │ │ └─┬ json-parse-helpfulerror@1.0.3
│ │ │ │   └── jju@1.2.1
│ │ │ ├─┬ readable-stream@1.1.13
│ │ │ │ ├── core-util-is@1.0.1
│ │ │ │ ├── isarray@0.0.1
│ │ │ │ └── string_decoder@0.10.31
│ │ │ ├── realize-package-specifier@3.0.1
│ │ │ ├─┬ request@2.69.0
│ │ │ │ ├── aws-sign2@0.6.0
│ │ │ │ ├─┬ aws4@1.2.1
│ │ │ │ │ └── lru-cache@2.7.3
│ │ │ │ ├─┬ bl@1.0.2
│ │ │ │ │ └─┬ readable-stream@2.0.5
│ │ │ │ │   ├── core-util-is@1.0.2
│ │ │ │ │   ├── isarray@0.0.1
│ │ │ │ │   ├── process-nextick-args@1.0.6
│ │ │ │ │   ├── string_decoder@0.10.31
│ │ │ │ │   └── util-deprecate@1.0.2
│ │ │ │ ├── caseless@0.11.0
│ │ │ │ ├─┬ combined-stream@1.0.5
│ │ │ │ │ └── delayed-stream@1.0.0
│ │ │ │ ├── extend@3.0.0
│ │ │ │ ├── forever-agent@0.6.1
│ │ │ │ ├─┬ form-data@1.0.0-rc3
│ │ │ │ │ └── async@1.5.2
│ │ │ │ ├─┬ har-validator@2.0.6
│ │ │ │ │ ├─┬ chalk@1.1.1
│ │ │ │ │ │ ├── ansi-styles@2.1.0
│ │ │ │ │ │ ├── escape-string-regexp@1.0.4
│ │ │ │ │ │ ├── has-ansi@2.0.0
│ │ │ │ │ │ └── supports-color@2.0.0
│ │ │ │ │ ├─┬ commander@2.9.0
│ │ │ │ │ │ └── graceful-readlink@1.0.1
│ │ │ │ │ ├─┬ is-my-json-valid@2.12.4
│ │ │ │ │ │ ├── generate-function@2.0.0
│ │ │ │ │ │ ├─┬ generate-object-property@1.2.0
│ │ │ │ │ │ │ └── is-property@1.0.2
│ │ │ │ │ │ ├── jsonpointer@2.0.0
│ │ │ │ │ │ └── xtend@4.0.1
│ │ │ │ │ └─┬ pinkie-promise@2.0.0
│ │ │ │ │   └── pinkie@2.0.4
│ │ │ │ ├─┬ hawk@3.1.3
│ │ │ │ │ ├── boom@2.10.1
│ │ │ │ │ ├── cryptiles@2.0.5
│ │ │ │ │ ├── hoek@2.16.3
│ │ │ │ │ └── sntp@1.0.9
│ │ │ │ ├─┬ http-signature@1.1.1
│ │ │ │ │ ├── assert-plus@0.2.0
│ │ │ │ │ ├─┬ jsprim@1.2.2
│ │ │ │ │ │ ├── extsprintf@1.0.2
│ │ │ │ │ │ ├── json-schema@0.2.2
│ │ │ │ │ │ └── verror@1.3.6
│ │ │ │ │ └─┬ sshpk@1.7.3
│ │ │ │ │   ├── asn1@0.2.3
│ │ │ │ │   ├── dashdash@1.12.2
│ │ │ │ │   ├── ecc-jsbn@0.1.1
│ │ │ │ │   ├── jodid25519@1.0.2
│ │ │ │ │   ├── jsbn@0.1.0
│ │ │ │ │   └── tweetnacl@0.13.3
│ │ │ │ ├── is-typedarray@1.0.0
│ │ │ │ ├── isstream@0.1.2
│ │ │ │ ├── json-stringify-safe@5.0.1
│ │ │ │ ├─┬ mime-types@2.1.9
│ │ │ │ │ └── mime-db@1.21.0
│ │ │ │ ├── node-uuid@1.4.7
│ │ │ │ ├── oauth-sign@0.8.1
│ │ │ │ ├── qs@6.0.2
│ │ │ │ ├── stringstream@0.0.5
│ │ │ │ ├── tough-cookie@2.2.1
│ │ │ │ └── tunnel-agent@0.4.2
│ │ │ ├── retry@0.9.0
│ │ │ ├─┬ rimraf@2.5.2
│ │ │ │ └─┬ glob@7.0.0
│ │ │ │   └── path-is-absolute@1.0.0
│ │ │ ├── semver@5.1.0
│ │ │ ├─┬ sha@2.0.1
│ │ │ │ └─┬ readable-stream@2.0.2
│ │ │ │   ├── core-util-is@1.0.1
│ │ │ │   ├── isarray@0.0.1
│ │ │ │   ├── process-nextick-args@1.0.3
│ │ │ │   ├── string_decoder@0.10.31
│ │ │ │   └── util-deprecate@1.0.1
│ │ │ ├── slide@1.1.6
│ │ │ ├── sorted-object@1.0.0
│ │ │ ├── spdx-license-ids@1.2.0
│ │ │ ├── strip-ansi@3.0.0
│ │ │ ├── tar@2.2.1
│ │ │ ├── text-table@0.2.0
│ │ │ ├── uid-number@0.0.6
│ │ │ ├── umask@1.1.0
│ │ │ ├─┬ validate-npm-package-license@3.0.1
│ │ │ │ ├── spdx-correct@1.0.2
│ │ │ │ └─┬ spdx-expression-parse@1.0.2
│ │ │ │   └── spdx-exceptions@1.0.4
│ │ │ ├─┬ validate-npm-package-name@2.2.2
│ │ │ │ └── builtins@0.0.7
│ │ │ ├─┬ which@1.2.4
│ │ │ │ ├─┬ is-absolute@0.1.7
│ │ │ │ │ └── is-relative@0.1.3
│ │ │ │ └── isexe@1.1.1
│ │ │ ├── wrappy@1.0.1
│ │ │ └── write-file-atomic@1.1.4
│ │ ├─┬ ora@0.2.3
│ │ │ └── cli-spinners@0.1.2
│ │ ├─┬ portfinder@1.0.10
│ │ │ └── async@1.5.2
│ │ ├── promise-map-series@0.2.3
│ │ ├─┬ quick-temp@0.1.5
│ │ │ ├── mktemp@0.3.5
│ │ │ ├── rimraf@2.2.8
│ │ │ └── underscore.string@2.3.3
│ │ ├─┬ readline2@0.1.1
│ │ │ ├── mute-stream@0.0.4
│ │ │ └─┬ strip-ansi@2.0.1
│ │ │   └── ansi-regex@1.1.1
│ │ ├── rsvp@3.3.3
│ │ ├─┬ sane@1.4.1
│ │ │ ├─┬ exec-sh@0.2.0
│ │ │ │ └── merge@1.2.0
│ │ │ ├─┬ fb-watchman@1.9.0
│ │ │ │ └─┬ bser@1.0.2
│ │ │ │   └── node-int64@0.4.0
│ │ │ ├─┬ walker@1.0.7
│ │ │ │ └─┬ makeerror@1.0.11
│ │ │ │   └── tmpl@1.0.4
│ │ │ └── watch@0.10.0
│ │ ├── semver@5.3.0
│ │ ├─┬ temp@0.8.3
│ │ │ └── rimraf@2.2.8
│ │ ├─┬ testem@1.13.0
│ │ │ ├─┬ backbone@1.3.3
│ │ │ │ └── underscore@1.8.3
│ │ │ ├── bluebird@3.4.6
│ │ │ ├── charm@1.0.2
│ │ │ ├─┬ consolidate@0.14.5
│ │ │ │ └── bluebird@3.4.6
│ │ │ ├── did_it_work@0.0.6
│ │ │ ├─┬ fireworm@0.7.1
│ │ │ │ ├── is-type@0.0.1
│ │ │ │ ├── lodash.debounce@3.1.1
│ │ │ │ └─┬ lodash.flatten@3.0.2
│ │ │ │   └── lodash._baseflatten@3.1.4
│ │ │ ├── lodash.assignin@4.2.0
│ │ │ ├── lodash.find@4.6.0
│ │ │ ├── mustache@2.3.0
│ │ │ ├─┬ node-notifier@4.6.1
│ │ │ │ ├─┬ cli-usage@0.1.4
│ │ │ │ │ └─┬ marked-terminal@1.7.0
│ │ │ │ │   ├─┬ cardinal@1.0.0
│ │ │ │ │   │ └─┬ redeyed@1.0.1
│ │ │ │ │   │   └── esprima@3.0.0
│ │ │ │ │   ├── lodash.assign@4.2.0
│ │ │ │ │   └─┬ node-emoji@1.4.3
│ │ │ │ │     └── string.prototype.codepointat@0.2.0
│ │ │ │ ├── growly@1.3.0
│ │ │ │ ├─┬ lodash.clonedeep@3.0.2
│ │ │ │ │ └── lodash._baseclone@3.3.0
│ │ │ │ └── shellwords@0.1.0
│ │ │ ├── printf@0.2.5
│ │ │ ├─┬ socket.io@1.5.0
│ │ │ │ ├─┬ engine.io@1.7.0
│ │ │ │ │ └─┬ engine.io-parser@1.3.0
│ │ │ │ │   ├── base64-arraybuffer@0.1.5
│ │ │ │ │   ├─┬ has-binary@0.1.6
│ │ │ │ │   │ └── isarray@0.0.1
│ │ │ │ │   └── wtf-8@1.0.0
│ │ │ │ └─┬ socket.io-client@1.5.0
│ │ │ │   ├── component-emitter@1.2.0
│ │ │ │   └── engine.io-client@1.7.0
│ │ │ ├── spawn-args@0.2.0
│ │ │ ├── styled_string@0.0.1
│ │ │ ├─┬ tap-parser@1.3.2
│ │ │ │ └── events-to-array@1.0.2
│ │ │ └── xmldom@0.1.27
│ │ ├── through@2.3.8
│ │ ├─┬ tiny-lr@0.2.1
│ │ │ ├─┬ faye-websocket@0.10.0
│ │ │ │ └─┬ websocket-driver@0.6.5
│ │ │ │   └── websocket-extensions@0.1.1
│ │ │ ├── livereload-js@2.2.2
│ │ │ └── qs@5.1.0
│ │ ├─┬ tree-sync@1.2.1
│ │ │ └── fs-tree-diff@0.5.5
│ │ ├─┬ walk-sync@0.2.7
│ │ │ └── matcher-collection@1.0.4
│ │ └─┬ yam@0.0.18
│ │   ├─┬ fs-extra@0.16.5
│ │   │ └─┬ graceful-fs@3.0.11
│ │   │   └── natives@1.1.0
│ │   └── lodash.merge@3.3.2
│ ├── ember-cli-string-utils@1.0.0
│ ├─┬ enhanced-resolve@2.3.0
│ │ ├── graceful-fs@4.1.11
│ │ ├─┬ memory-fs@0.3.0
│ │ │ └─┬ readable-stream@2.2.2
│ │ │   ├── buffer-shims@1.0.0
│ │ │   ├── isarray@1.0.0
│ │ │   └── process-nextick-args@1.0.7
│ │ └── tapable@0.2.5
│ ├── exit@0.1.2
│ ├─┬ exports-loader@0.6.3
│ │ └─┬ source-map@0.1.43
│ │   └── amdefine@1.0.1
│ ├── expose-loader@0.7.1
│ ├── file-loader@0.8.5
│ ├─┬ fs-extra@0.30.0
│ │ ├── graceful-fs@4.1.11
│ │ ├─┬ jsonfile@2.4.0
│ │ │ └── graceful-fs@4.1.11
│ │ ├─┬ klaw@1.3.1
│ │ │ └── graceful-fs@4.1.11
│ │ └── path-is-absolute@1.0.1
│ ├── fs.realpath@1.0.0
│ ├─┬ glob@7.1.1
│ │ ├─┬ inflight@1.0.6
│ │ │ └── wrappy@1.0.2
│ │ ├── inherits@2.0.3
│ │ └── once@1.4.0
│ ├─┬ handlebars@4.0.6
│ │ ├── async@1.5.2
│ │ ├── source-map@0.4.4
│ │ └─┬ uglify-js@2.7.5
│ │   ├── source-map@0.5.6
│ │   ├── uglify-to-browserify@1.0.2
│ │   └─┬ yargs@3.10.0
│ │     ├── camelcase@1.2.1
│ │     ├─┬ cliui@2.1.0
│ │     │ ├─┬ center-align@0.1.3
│ │     │ │ ├─┬ align-text@0.1.4
│ │     │ │ │ ├── longest@1.0.1
│ │     │ │ │ └── repeat-string@1.6.1
│ │     │ │ └── lazy-cache@1.0.4
│ │     │ ├── right-align@0.1.3
│ │     │ └── wordwrap@0.0.2
│ │     └── window-size@0.1.0
│ ├─┬ html-webpack-plugin@2.24.1
│ │ ├── bluebird@3.4.6
│ │ ├─┬ html-minifier@3.2.3
│ │ │ ├─┬ camel-case@3.0.0
│ │ │ │ ├─┬ no-case@2.3.0
│ │ │ │ │ └── lower-case@1.1.3
│ │ │ │ └── upper-case@1.1.3
│ │ │ ├─┬ clean-css@3.4.22
│ │ │ │ └── commander@2.8.1
│ │ │ ├── he@1.1.0
│ │ │ ├─┬ ncname@1.0.0
│ │ │ │ └── xml-char-classes@1.0.0
│ │ │ ├── param-case@2.1.0
│ │ │ └── relateurl@0.2.7
│ │ ├─┬ pretty-error@2.0.2
│ │ │ ├─┬ renderkid@2.0.0
│ │ │ │ ├─┬ css-select@1.2.0
│ │ │ │ │ ├── boolbase@1.0.0
│ │ │ │ │ ├── css-what@2.1.0
│ │ │ │ │ ├─┬ domutils@1.5.1
│ │ │ │ │ │ └─┬ dom-serializer@0.1.0
│ │ │ │ │ │   └── domelementtype@1.1.3
│ │ │ │ │ └── nth-check@1.0.1
│ │ │ │ ├─┬ dom-converter@0.1.4
│ │ │ │ │ └── utila@0.3.3
│ │ │ │ ├─┬ htmlparser2@3.3.0
│ │ │ │ │ ├── domelementtype@1.3.0
│ │ │ │ │ ├── domhandler@2.1.0
│ │ │ │ │ ├── domutils@1.1.6
│ │ │ │ │ └─┬ readable-stream@1.0.34
│ │ │ │ │   └── isarray@0.0.1
│ │ │ │ └── utila@0.3.3
│ │ │ └── utila@0.4.0
│ │ └── toposort@1.0.0
│ ├── istanbul-instrumenter-loader@0.2.0
│ ├── json-loader@0.5.4
│ ├─┬ karma-sourcemap-loader@0.3.7
│ │ └── graceful-fs@4.1.11
│ ├─┬ karma-webpack@1.8.0
│ │ ├── async@0.9.2
│ │ ├── lodash@3.10.1
│ │ ├── source-map@0.1.43
│ │ └── webpack-dev-middleware@1.8.4
│ ├─┬ leek@0.0.21
│ │ ├─┬ lodash.assign@3.2.0
│ │ │ ├─┬ lodash._baseassign@3.2.0
│ │ │ │ └── lodash._basecopy@3.0.1
│ │ │ ├─┬ lodash._createassigner@3.1.1
│ │ │ │ ├── lodash._bindcallback@3.0.1
│ │ │ │ ├── lodash._isiterateecall@3.0.9
│ │ │ │ └── lodash.restparam@3.6.1
│ │ │ └── lodash.keys@3.1.2
│ │ └─┬ request@2.79.0
│ │   ├── aws4@1.5.0
│ │   ├─┬ form-data@2.1.2
│ │   │ └── asynckit@0.4.0
│ │   ├── qs@6.3.0
│ │   ├── tough-cookie@2.3.2
│ │   └── uuid@3.0.1
│ ├─┬ less@2.7.1
│ │ ├─┬ errno@0.1.4
│ │ │ └── prr@0.0.0
│ │ ├── graceful-fs@4.1.11
│ │ ├── image-size@0.5.0
│ │ ├─┬ promise@7.1.1
│ │ │ └── asap@2.0.5
│ │ └── source-map@0.5.6
│ ├── less-loader@2.2.3
│ ├── lodash@4.17.2
│ ├─┬ node-sass@3.13.1
│ │ ├── async-foreach@0.1.3
│ │ ├─┬ cross-spawn@3.0.1
│ │ │ └─┬ lru-cache@4.0.2
│ │ │   ├── pseudomap@1.0.2
│ │ │   └── yallist@2.0.0
│ │ ├─┬ gaze@1.1.2
│ │ │ └─┬ globule@1.1.0
│ │ │   └── lodash@4.16.6
│ │ ├── get-stdin@4.0.1
│ │ ├── in-publish@2.0.0
│ │ ├── lodash.assign@4.2.0
│ │ ├── lodash.clonedeep@4.5.0
│ │ ├─┬ meow@3.7.0
│ │ │ ├─┬ camelcase-keys@2.1.0
│ │ │ │ └── camelcase@2.1.1
│ │ │ ├─┬ loud-rejection@1.6.0
│ │ │ │ ├─┬ currently-unhandled@0.4.1
│ │ │ │ │ └── array-find-index@1.0.2
│ │ │ │ └── signal-exit@3.0.2
│ │ │ ├── map-obj@1.0.1
│ │ │ ├─┬ normalize-package-data@2.3.5
│ │ │ │ ├── hosted-git-info@2.1.5
│ │ │ │ ├─┬ is-builtin-module@1.0.0
│ │ │ │ │ └── builtin-modules@1.1.1
│ │ │ │ └─┬ validate-npm-package-license@3.0.1
│ │ │ │   ├─┬ spdx-correct@1.0.2
│ │ │ │   │ └── spdx-license-ids@1.2.2
│ │ │ │   └── spdx-expression-parse@1.0.4
│ │ │ ├─┬ redent@1.0.0
│ │ │ │ ├─┬ indent-string@2.1.0
│ │ │ │ │ └── repeating@2.0.1
│ │ │ │ └── strip-indent@1.0.1
│ │ │ └── trim-newlines@1.0.0
│ │ ├── nan@2.4.0
│ │ ├─┬ node-gyp@3.4.0
│ │ │ ├─┬ fstream@1.0.10
│ │ │ │ └── graceful-fs@4.1.11
│ │ │ ├── graceful-fs@4.1.11
│ │ │ ├─┬ npmlog@3.1.2
│ │ │ │ └─┬ gauge@2.6.0
│ │ │ │   └── has-color@0.1.7
│ │ │ ├─┬ path-array@1.0.1
│ │ │ │ └─┬ array-index@1.0.0
│ │ │ │   └─┬ es6-symbol@3.1.0
│ │ │ │     ├── d@0.1.1
│ │ │ │     └─┬ es5-ext@0.10.12
│ │ │ │       └── es6-iterator@2.0.0
│ │ │ └─┬ tar@2.2.1
│ │ │   └── block-stream@0.0.9
│ │ ├─┬ npmlog@4.0.2
│ │ │ ├─┬ are-we-there-yet@1.1.2
│ │ │ │ └── delegates@1.0.0
│ │ │ ├── console-control-strings@1.1.0
│ │ │ ├─┬ gauge@2.7.2
│ │ │ │ ├── aproba@1.0.4
│ │ │ │ ├── has-unicode@2.0.1
│ │ │ │ ├── supports-color@0.2.0
│ │ │ │ └── wide-align@1.1.0
│ │ │ └── set-blocking@2.0.0
│ │ └─┬ sass-graph@2.1.2
│ │   └─┬ yargs@4.8.1
│ │     ├── cliui@3.2.0
│ │     ├── lodash.assign@4.2.0
│ │     └── window-size@0.2.0
│ ├─┬ npm-run-all@3.1.2
│ │ ├── cross-spawn@4.0.2
│ │ ├── pinkie-promise@2.0.1
│ │ ├─┬ ps-tree@1.1.0
│ │ │ └─┬ event-stream@3.3.4
│ │ │   ├── duplexer@0.1.1
│ │ │   ├── from@0.1.3
│ │ │   ├── map-stream@0.1.0
│ │ │   ├── pause-stream@0.0.11
│ │ │   ├── split@0.3.3
│ │ │   └── stream-combiner@0.0.4
│ │ ├─┬ read-pkg@1.1.0
│ │ │ ├─┬ load-json-file@1.1.0
│ │ │ │ └── graceful-fs@4.1.11
│ │ │ └─┬ path-type@1.1.0
│ │ │   └── graceful-fs@4.1.11
│ │ ├─┬ read-pkg-up@1.0.1
│ │ │ └─┬ find-up@1.1.2
│ │ │   └── path-exists@2.1.0
│ │ ├─┬ shell-quote@1.6.1
│ │ │ ├── array-filter@0.0.1
│ │ │ ├── array-map@0.0.0
│ │ │ ├── array-reduce@0.0.0
│ │ │ └── jsonify@0.0.0
│ │ └─┬ string.prototype.padend@3.0.0
│ │   ├─┬ define-properties@1.1.2
│ │   │ ├── foreach@2.0.5
│ │   │ └── object-keys@1.0.11
│ │   ├─┬ es-abstract@1.6.1
│ │   │ ├─┬ es-to-primitive@1.1.1
│ │   │ │ ├── is-date-object@1.0.1
│ │   │ │ └── is-symbol@1.0.1
│ │   │ ├── is-callable@1.1.3
│ │   │ └── is-regex@1.0.3
│ │   └── function-bind@1.1.0
│ ├─┬ offline-plugin@3.4.2
│ │ ├── deep-extend@0.4.1
│ │ ├── ejs@2.5.5
│ │ └── es6-promise@3.3.1
│ ├── opn@4.0.1
│ ├── parse5@2.2.3
│ ├── postcss-loader@0.9.1
│ ├─┬ protractor@3.3.0
│ │ ├── glob@6.0.4
│ │ ├─┬ jasmine@2.4.1
│ │ │ └─┬ glob@3.2.11
│ │ │   └─┬ minimatch@0.3.0
│ │ │     ├── lru-cache@2.7.3
│ │ │     └── sigmund@1.0.1
│ │ ├── jasminewd2@0.0.9
│ │ ├─┬ request@2.67.0
│ │ │ ├── aws-sign2@0.6.0
│ │ │ ├─┬ bl@1.0.3
│ │ │ │ └── readable-stream@2.0.6
│ │ │ ├── caseless@0.11.0
│ │ │ ├─┬ combined-stream@1.0.5
│ │ │ │ └── delayed-stream@1.0.0
│ │ │ ├── forever-agent@0.6.1
│ │ │ ├─┬ form-data@1.0.1
│ │ │ │ └── async@2.1.4
│ │ │ ├─┬ har-validator@2.0.6
│ │ │ │ └─┬ is-my-json-valid@2.15.0
│ │ │ │   ├── generate-function@2.0.0
│ │ │ │   ├─┬ generate-object-property@1.2.0
│ │ │ │   │ └── is-property@1.0.2
│ │ │ │   └── jsonpointer@4.0.0
│ │ │ ├─┬ hawk@3.1.3
│ │ │ │ ├── boom@2.10.1
│ │ │ │ ├── cryptiles@2.0.5
│ │ │ │ ├── hoek@2.16.3
│ │ │ │ └── sntp@1.0.9
│ │ │ ├─┬ http-signature@1.1.1
│ │ │ │ ├── assert-plus@0.2.0
│ │ │ │ ├─┬ jsprim@1.3.1
│ │ │ │ │ ├── extsprintf@1.0.2
│ │ │ │ │ ├── json-schema@0.2.3
│ │ │ │ │ └── verror@1.3.6
│ │ │ │ └─┬ sshpk@1.10.1
│ │ │ │   ├── asn1@0.2.3
│ │ │ │   ├── assert-plus@1.0.0
│ │ │ │   ├── bcrypt-pbkdf@1.0.0
│ │ │ │   ├─┬ dashdash@1.14.1
│ │ │ │   │ └── assert-plus@1.0.0
│ │ │ │   ├── ecc-jsbn@0.1.1
│ │ │ │   ├─┬ getpass@0.1.6
│ │ │ │   │ └── assert-plus@1.0.0
│ │ │ │   ├── jodid25519@1.0.2
│ │ │ │   ├── jsbn@0.1.0
│ │ │ │   └── tweetnacl@0.14.5
│ │ │ ├── is-typedarray@1.0.0
│ │ │ ├── isstream@0.1.2
│ │ │ ├── json-stringify-safe@5.0.1
│ │ │ ├─┬ mime-types@2.1.13
│ │ │ │ └── mime-db@1.25.0
│ │ │ ├── node-uuid@1.4.7
│ │ │ ├── oauth-sign@0.8.2
│ │ │ ├── qs@5.2.1
│ │ │ ├── stringstream@0.0.5
│ │ │ ├── tough-cookie@2.2.2
│ │ │ └── tunnel-agent@0.4.3
│ │ ├── saucelabs@1.0.1
│ │ ├─┬ selenium-webdriver@2.52.0
│ │ │ ├── adm-zip@0.4.4
│ │ │ └── tmp@0.0.24
│ │ └─┬ source-map-support@0.4.6
│ │   └── source-map@0.5.6
│ ├── raw-loader@0.5.1
│ ├─┬ remap-istanbul@0.6.4
│ │ ├── amdefine@1.0.0
│ │ ├─┬ gulp-util@3.0.7
│ │ │ ├── array-differ@1.0.0
│ │ │ ├── array-uniq@1.0.3
│ │ │ ├── beeper@1.1.1
│ │ │ ├── dateformat@1.0.12
│ │ │ ├─┬ fancy-log@1.2.0
│ │ │ │ └── time-stamp@1.0.1
│ │ │ ├─┬ gulplog@1.0.0
│ │ │ │ └── glogg@1.0.0
│ │ │ ├─┬ has-gulplog@0.1.0
│ │ │ │ └── sparkles@1.0.0
│ │ │ ├── lodash._reescape@3.0.0
│ │ │ ├── lodash._reevaluate@3.0.0
│ │ │ ├── lodash._reinterpolate@3.0.0
│ │ │ ├─┬ lodash.template@3.6.2
│ │ │ │ ├── lodash._basetostring@3.0.1
│ │ │ │ ├── lodash._basevalues@3.0.0
│ │ │ │ ├── lodash.escape@3.2.0
│ │ │ │ └── lodash.templatesettings@3.1.1
│ │ │ ├─┬ multipipe@0.1.2
│ │ │ │ └─┬ duplexer2@0.0.2
│ │ │ │   └─┬ readable-stream@1.1.14
│ │ │ │     └── isarray@0.0.1
│ │ │ ├── object-assign@3.0.0
│ │ │ ├── replace-ext@0.0.1
│ │ │ └─┬ vinyl@0.5.3
│ │ │   └── clone-stats@0.0.1
│ │ ├─┬ istanbul@0.4.3
│ │ │ ├── async@1.5.2
│ │ │ ├─┬ fileset@0.2.1
│ │ │ │ ├── glob@5.0.15
│ │ │ │ └── minimatch@2.0.10
│ │ │ ├── resolve@1.1.7
│ │ │ ├── supports-color@3.1.2
│ │ │ └── wordwrap@1.0.0
│ │ ├── source-map@0.5.6
│ │ └─┬ through2@2.0.1
│ │   └── readable-stream@2.0.6
│ ├── resolve@1.2.0
│ ├── rimraf@2.5.4
│ ├─┬ sass-loader@3.2.3
│ │ └── async@1.5.2
│ ├── script-loader@0.7.0
│ ├─┬ shelljs@0.7.5
│ │ ├── interpret@1.0.1
│ │ └── rechoir@0.6.2
│ ├── silent-error@1.0.1
│ ├─┬ source-map-loader@0.1.5
│ │ ├── async@0.9.2
│ │ └── source-map@0.1.43
│ ├── sourcemap-istanbul-instrumenter-loader@0.2.0
│ ├─┬ string-replace-loader@1.0.5
│ │ └── lodash@3.10.1
│ ├── style-loader@0.13.1
│ ├─┬ stylus@0.54.5
│ │ ├── css-parse@1.7.0
│ │ ├── glob@7.0.6
│ │ ├── sax@0.5.8
│ │ └── source-map@0.1.43
│ ├─┬ stylus-loader@2.4.0
│ │ └── when@3.6.4
│ ├── symlink-or-copy@1.1.8
│ ├─┬ ts-loader@0.8.2
│ │ ├─┬ enhanced-resolve@0.9.1
│ │ │ ├── graceful-fs@4.1.11
│ │ │ ├── memory-fs@0.2.0
│ │ │ └── tapable@0.1.10
│ │ └── object-assign@2.1.1
│ ├─┬ tslint@3.15.1
│ │ ├─┬ findup-sync@0.3.0
│ │ │ └── glob@5.0.15
│ │ └── underscore.string@3.3.4
│ ├─┬ tslint-loader@2.1.5
│ │ └── strip-json-comments@1.0.4
│ ├─┬ typedoc@0.4.5
│ │ ├─┬ handlebars@4.0.5
│ │ │ └── async@1.5.2
│ │ ├── highlight.js@9.9.0
│ │ ├── marked@0.3.6
│ │ ├── progress@1.1.8
│ │ ├── typedoc-default-themes@0.4.1
│ │ └── typescript@1.8.10
│ ├─┬ url-loader@0.5.7
│ │ └── mime@1.2.11
│ ├─┬ webpack@2.1.0-beta.25
│ │ ├── acorn@3.3.0
│ │ ├─┬ ajv@4.10.0
│ │ │ └── co@4.6.0
│ │ ├── async@1.5.2
│ │ ├── clone@1.0.2
│ │ ├── loader-runner@2.2.0
│ │ ├─┬ node-libs-browser@1.1.1
│ │ │ ├── assert@1.4.1
│ │ │ ├─┬ browserify-zlib@0.1.4
│ │ │ │ └── pako@0.2.9
│ │ │ ├─┬ buffer@4.9.1
│ │ │ │ ├── base64-js@1.2.0
│ │ │ │ └── ieee754@1.1.8
│ │ │ ├─┬ console-browserify@1.1.0
│ │ │ │ └── date-now@0.1.4
│ │ │ ├── constants-browserify@1.0.0
│ │ │ ├─┬ crypto-browserify@3.11.0
│ │ │ │ ├─┬ browserify-cipher@1.0.0
│ │ │ │ │ ├─┬ browserify-aes@1.0.6
│ │ │ │ │ │ └── buffer-xor@1.0.3
│ │ │ │ │ ├─┬ browserify-des@1.0.0
│ │ │ │ │ │ └── des.js@1.0.0
│ │ │ │ │ └── evp_bytestokey@1.0.0
│ │ │ │ ├─┬ browserify-sign@4.0.0
│ │ │ │ │ ├── bn.js@4.11.6
│ │ │ │ │ ├── browserify-rsa@4.0.1
│ │ │ │ │ ├─┬ elliptic@6.3.2
│ │ │ │ │ │ ├── brorand@1.0.6
│ │ │ │ │ │ └── hash.js@1.0.3
│ │ │ │ │ └─┬ parse-asn1@5.0.0
│ │ │ │ │   └── asn1.js@4.9.0
│ │ │ │ ├── create-ecdh@4.0.0
│ │ │ │ ├─┬ create-hash@1.1.2
│ │ │ │ │ ├── cipher-base@1.0.3
│ │ │ │ │ ├── ripemd160@1.0.1
│ │ │ │ │ └── sha.js@2.4.8
│ │ │ │ ├── create-hmac@1.1.4
│ │ │ │ ├─┬ diffie-hellman@5.0.2
│ │ │ │ │ └── miller-rabin@4.0.0
│ │ │ │ ├── pbkdf2@3.0.9
│ │ │ │ ├── public-encrypt@4.0.0
│ │ │ │ └── randombytes@2.0.3
│ │ │ ├── domain-browser@1.1.7
│ │ │ ├── events@1.1.1
│ │ │ ├── https-browserify@0.0.1
│ │ │ ├── os-browserify@0.2.1
│ │ │ ├── path-browserify@0.0.0
│ │ │ ├── process@0.11.9
│ │ │ ├── punycode@1.4.1
│ │ │ ├── querystring-es3@0.2.1
│ │ │ ├── stream-browserify@2.0.1
│ │ │ ├─┬ stream-http@2.5.0
│ │ │ │ ├── builtin-status-codes@2.0.0
│ │ │ │ └── to-arraybuffer@1.0.1
│ │ │ ├── string_decoder@0.10.31
│ │ │ ├── timers-browserify@1.4.2
│ │ │ ├── tty-browserify@0.0.0
│ │ │ ├─┬ url@0.11.0
│ │ │ │ ├── punycode@1.3.2
│ │ │ │ └── querystring@0.2.0
│ │ │ ├─┬ util@0.10.3
│ │ │ │ └── inherits@2.0.1
│ │ │ └── vm-browserify@0.0.4
│ │ ├── source-map@0.5.6
│ │ ├─┬ supports-color@3.1.2
│ │ │ └── has-flag@1.0.0
│ │ ├─┬ watchpack@1.1.0
│ │ │ ├── async@2.0.0-rc.4
│ │ │ └── graceful-fs@4.1.11
│ │ └─┬ yargs@4.8.1
│ │   ├─┬ cliui@3.2.0
│ │   │ └── wrap-ansi@2.1.0
│ │   ├── lodash.assign@4.2.0
│ │   ├─┬ os-locale@1.4.0
│ │   │ └─┬ lcid@1.0.0
│ │   │   └── invert-kv@1.0.0
│ │   ├── require-directory@2.1.1
│ │   ├── require-main-filename@1.0.1
│ │   ├── which-module@1.0.0
│ │   ├── window-size@0.2.0
│ │   ├── y18n@3.2.1
│ │   └─┬ yargs-parser@2.4.1
│ │     ├── camelcase@3.0.0
│ │     └── lodash.assign@4.2.0
│ ├─┬ webpack-dev-server@2.1.0-beta.9
│ │ ├── connect-history-api-fallback@1.3.0
│ │ ├─┬ http-proxy-middleware@0.17.3
│ │ │ ├─┬ is-glob@3.1.0
│ │ │ │ └── is-extglob@2.1.1
│ │ │ └─┬ micromatch@2.3.11
│ │ │   ├─┬ arr-diff@2.0.0
│ │ │   │ └── arr-flatten@1.0.1
│ │ │   ├─┬ braces@1.8.5
│ │ │   │ ├─┬ expand-range@1.8.2
│ │ │   │ │ └─┬ fill-range@2.2.3
│ │ │   │ │   ├── is-number@2.1.0
│ │ │   │ │   ├── isobject@2.1.0
│ │ │   │ │   └── randomatic@1.1.6
│ │ │   │ ├── preserve@0.2.0
│ │ │   │ └── repeat-element@1.1.2
│ │ │   ├─┬ expand-brackets@0.1.5
│ │ │   │ └── is-posix-bracket@0.1.1
│ │ │   ├── extglob@0.3.2
│ │ │   ├── filename-regex@2.0.0
│ │ │   ├── kind-of@3.1.0
│ │ │   ├── normalize-path@2.0.1
│ │ │   ├─┬ object.omit@2.0.1
│ │ │   │ ├─┬ for-own@0.1.4
│ │ │   │ │ └── for-in@0.1.6
│ │ │   │ └── is-extendable@0.1.1
│ │ │   ├─┬ parse-glob@3.0.4
│ │ │   │ ├── glob-base@0.3.0
│ │ │   │ └── is-dotfile@1.0.2
│ │ │   └─┬ regex-cache@0.4.3
│ │ │     ├── is-equal-shallow@0.1.3
│ │ │     └── is-primitive@2.0.0
│ │ ├── opn@4.0.2
│ │ ├─┬ serve-index@1.8.0
│ │ │ ├── batch@0.5.3
│ │ │ └─┬ http-errors@1.5.1
│ │ │   └── setprototypeof@1.0.2
│ │ ├─┬ sockjs@0.3.18
│ │ │ └── uuid@2.0.3
│ │ ├─┬ sockjs-client@1.1.1
│ │ │ ├─┬ eventsource@0.1.6
│ │ │ │ └─┬ original@1.0.0
│ │ │ │   └── url-parse@1.0.5
│ │ │ ├── faye-websocket@0.11.0
│ │ │ ├── json3@3.3.2
│ │ │ └─┬ url-parse@1.1.7
│ │ │   └── querystringify@0.0.4
│ │ ├─┬ spdy@3.4.4
│ │ │ ├── handle-thing@1.2.5
│ │ │ ├── http-deceiver@1.2.7
│ │ │ ├── select-hose@2.0.0
│ │ │ └─┬ spdy-transport@2.0.18
│ │ │   ├── hpack.js@2.1.6
│ │ │   ├── obuf@1.1.1
│ │ │   └─┬ wbuf@1.7.2
│ │ │     └── minimalistic-assert@1.0.0
│ │ ├── supports-color@3.1.2
│ │ └─┬ yargs@4.8.1
│ │   ├── cliui@3.2.0
│ │   ├── lodash.assign@4.2.0
│ │   └── window-size@0.2.0
│ ├─┬ webpack-md5-hash@0.0.5
│ │ └─┬ md5@2.2.1
│ │   ├── charenc@0.0.1
│ │   ├── crypt@0.0.1
│ │   └── is-buffer@1.1.4
│ └─┬ webpack-merge@0.14.1
│   ├─┬ lodash.find@3.2.1
│   │ ├─┬ lodash._basecallback@3.3.1
│   │ │ ├── lodash._baseisequal@3.0.7
│   │ │ └── lodash.pairs@3.0.1
│   │ ├── lodash._baseeach@3.0.4
│   │ ├── lodash._basefind@3.0.0
│   │ ├── lodash._basefindindex@3.6.0
│   │ └── lodash.isarray@3.0.4
│   ├── lodash.isequal@4.4.0
│   ├─┬ lodash.isplainobject@3.2.0
│   │ ├── lodash._basefor@3.0.3
│   │ ├── lodash.isarguments@3.1.0
│   │ └── lodash.keysin@3.0.8
│   └─┬ lodash.merge@3.3.2
│     ├── lodash._arraycopy@3.0.0
│     ├── lodash._arrayeach@3.0.0
│     ├── lodash._getnative@3.9.1
│     ├── lodash.istypedarray@3.0.6
│     └── lodash.toplainobject@3.0.0
├── angular2-toaster@1.0.2
├─┬ codelyzer@1.0.0-beta.1
│ ├── escape-string-regexp@1.0.5
│ └── sprintf-js@1.0.3
├── core-js@2.4.1
├── file-saver@1.3.3
├── jasmine-core@2.4.1
├─┬ jasmine-spec-reporter@2.5.0
│ └── colors@1.1.2
├─┬ karma@1.2.0
│ ├── bluebird@3.4.6
│ ├─┬ body-parser@1.14.2
│ │ ├── bytes@2.2.0
│ │ ├── content-type@1.0.2
│ │ ├── depd@1.1.0
│ │ ├─┬ http-errors@1.3.1
│ │ │ └── statuses@1.3.1
│ │ ├── iconv-lite@0.4.13
│ │ ├─┬ on-finished@2.3.0
│ │ │ └── ee-first@1.1.1
│ │ ├── qs@5.2.0
│ │ ├─┬ raw-body@2.1.7
│ │ │ ├── bytes@2.4.0
│ │ │ ├── iconv-lite@0.4.13
│ │ │ └── unpipe@1.0.0
│ │ └─┬ type-is@1.6.14
│ │   └── media-typer@0.3.0
│ ├─┬ chokidar@1.6.1
│ │ ├── anymatch@1.3.0
│ │ ├── async-each@1.0.1
│ │ ├── fsevents@^1.0.0
│ │ ├── glob-parent@2.0.0
│ │ ├─┬ is-binary-path@1.0.1
│ │ │ └── binary-extensions@1.8.0
│ │ ├─┬ is-glob@2.0.1
│ │ │ └── is-extglob@1.0.0
│ │ └─┬ readdirp@2.1.0
│ │   ├── graceful-fs@4.1.11
│ │   └── set-immediate-shim@1.0.1
│ ├── combine-lists@1.0.1
│ ├─┬ connect@3.5.0
│ │ ├── finalhandler@0.5.0
│ │ ├── parseurl@1.3.1
│ │ └── utils-merge@1.0.0
│ ├── di@0.0.1
│ ├─┬ dom-serialize@2.2.1
│ │ ├── custom-event@1.0.1
│ │ ├── ent@2.2.0
│ │ ├── extend@3.0.0
│ │ └── void-elements@2.0.1
│ ├─┬ expand-braces@0.1.2
│ │ ├── array-slice@0.2.3
│ │ ├── array-unique@0.2.1
│ │ └─┬ braces@0.1.5
│ │   └─┬ expand-range@0.1.1
│ │     ├── is-number@0.1.1
│ │     └── repeat-string@0.2.2
│ ├── graceful-fs@4.1.11
│ ├─┬ http-proxy@1.16.2
│ │ ├── eventemitter3@1.2.0
│ │ └── requires-port@1.0.0
│ ├── isbinaryfile@3.0.1
│ ├── lodash@3.10.1
│ ├─┬ log4js@0.6.38
│ │ ├─┬ readable-stream@1.0.34
│ │ │ ├── core-util-is@1.0.2
│ │ │ └── isarray@0.0.1
│ │ └── semver@4.3.6
│ ├── mime@1.3.4
│ ├─┬ minimatch@3.0.3
│ │ └─┬ brace-expansion@1.1.6
│ │   ├── balanced-match@0.4.2
│ │   └── concat-map@0.0.1
│ ├─┬ optimist@0.6.1
│ │ ├── minimist@0.0.10
│ │ └── wordwrap@0.0.3
│ ├── qjobs@1.1.5
│ ├─┬ socket.io@1.4.7
│ │ ├─┬ engine.io@1.6.10
│ │ │ ├─┬ accepts@1.1.4
│ │ │ │ ├─┬ mime-types@2.0.14
│ │ │ │ │ └── mime-db@1.12.0
│ │ │ │ └── negotiator@0.4.9
│ │ │ ├── base64id@0.1.0
│ │ │ ├─┬ engine.io-parser@1.2.4
│ │ │ │ ├── after@0.8.1
│ │ │ │ ├── arraybuffer.slice@0.0.6
│ │ │ │ ├── base64-arraybuffer@0.1.2
│ │ │ │ ├── blob@0.0.4
│ │ │ │ ├─┬ has-binary@0.1.6
│ │ │ │ │ └── isarray@0.0.1
│ │ │ │ └── utf8@2.1.0
│ │ │ └── ws@1.0.1
│ │ ├─┬ has-binary@0.1.7
│ │ │ └── isarray@0.0.1
│ │ ├─┬ socket.io-adapter@0.4.0
│ │ │ └─┬ socket.io-parser@2.2.2
│ │ │   ├── debug@0.7.4
│ │ │   ├── isarray@0.0.1
│ │ │   └── json3@3.2.6
│ │ ├─┬ socket.io-client@1.4.6
│ │ │ ├── backo2@1.0.2
│ │ │ ├── component-bind@1.0.0
│ │ │ ├── component-emitter@1.2.0
│ │ │ ├─┬ engine.io-client@1.6.9
│ │ │ │ ├── component-emitter@1.1.2
│ │ │ │ ├── component-inherit@0.0.3
│ │ │ │ ├── has-cors@1.1.0
│ │ │ │ ├── parsejson@0.0.1
│ │ │ │ ├── parseqs@0.0.2
│ │ │ │ ├── xmlhttprequest-ssl@1.5.1
│ │ │ │ └── yeast@0.1.2
│ │ │ ├── indexof@0.0.1
│ │ │ ├── object-component@0.0.3
│ │ │ ├─┬ parseuri@0.0.4
│ │ │ │ └─┬ better-assert@1.0.2
│ │ │ │   └── callsite@1.0.0
│ │ │ └── to-array@0.1.4
│ │ └─┬ socket.io-parser@2.2.6
│ │   ├── benchmark@1.0.0
│ │   ├── component-emitter@1.1.2
│ │   ├── isarray@0.0.1
│ │   └── json3@3.3.2
│ ├── source-map@0.5.6
│ ├─┬ tmp@0.0.28
│ │ └── os-tmpdir@1.0.2
│ └─┬ useragent@2.1.9
│   └── lru-cache@2.2.4
├─┬ karma-chrome-launcher@2.0.0
│ ├─┬ fs-access@1.0.1
│ │ └── null-check@1.0.0
│ └─┬ which@1.2.12
│   └── isexe@1.1.2
├── karma-cli@1.0.1
├── karma-jasmine@1.1.0
├─┬ karma-remap-istanbul@0.2.1
│ └─┬ istanbul@0.4.5
│   ├── abbrev@1.0.9
│   ├── async@1.5.2
│   ├─┬ escodegen@1.8.1
│   │ ├── estraverse@1.9.3
│   │ ├── esutils@2.0.2
│   │ ├─┬ optionator@0.8.2
│   │ │ ├── deep-is@0.1.3
│   │ │ ├── fast-levenshtein@2.0.5
│   │ │ ├── levn@0.3.0
│   │ │ ├── prelude-ls@1.1.2
│   │ │ ├── type-check@0.3.2
│   │ │ └── wordwrap@1.0.0
│   │ └── source-map@0.2.0
│   ├── esprima@2.7.3
│   ├── glob@5.0.15
│   ├── js-yaml@3.6.1
│   ├── resolve@1.1.7
│   ├── supports-color@3.1.2
│   └── wordwrap@1.0.0
├── ng2-page-scroll@4.0.0-beta.0
├── ng2-translate@4.2.0
├── papaparse@4.1.2
├─┬ protractor@4.0.9
│ ├── @types/q@0.0.30
│ ├── @types/selenium-webdriver@2.53.36
│ ├── adm-zip@0.4.7
│ ├─┬ jasmine@2.5.2
│ │ └── jasmine-core@2.5.2
│ ├── jasminewd2@0.0.10
│ ├── q@1.4.1
│ ├─┬ saucelabs@1.3.0
│ │ └─┬ https-proxy-agent@1.0.0
│ │   └─┬ agent-base@2.0.1
│ │     └── semver@5.0.3
│ ├─┬ selenium-webdriver@2.53.3
│ │ ├── adm-zip@0.4.4
│ │ ├── tmp@0.0.24
│ │ ├─┬ ws@1.1.1
│ │ │ ├── options@0.0.6
│ │ │ └── ultron@1.0.2
│ │ └─┬ xml2js@0.4.4
│ │   ├── sax@0.6.1
│ │   └── xmlbuilder@8.2.2
│ ├─┬ source-map-support@0.4.6
│ │ └── source-map@0.5.6
│ └─┬ webdriver-manager@10.2.10
│   ├─┬ del@2.2.2
│   │ ├─┬ globby@5.0.0
│   │ │ └── array-union@1.0.2
│   │ ├── is-path-cwd@1.0.0
│   │ ├─┬ is-path-in-cwd@1.0.0
│   │ │ └─┬ is-path-inside@1.0.0
│   │ │   └── path-is-inside@1.0.2
│   │ └── pify@2.3.0
│   └── ini@1.3.4
├─┬ rxjs@5.0.0-beta.12
│ └── symbol-observable@1.0.4
├─┬ talisman@0.14.0
│ ├── html-entities@1.2.0
│ ├── long@3.2.0
│ └── mnemonist@0.4.0
├── ts-helpers@1.1.2
├─┬ ts-node@1.2.1
│ ├── arrify@1.0.1
│ ├── diff@2.2.3
│ ├── make-error@1.2.1
│ ├── minimist@1.2.0
│ ├─┬ mkdirp@0.5.1
│ │ └── minimist@0.0.8
│ ├── pinkie@2.0.4
│ ├─┬ source-map-support@0.4.6
│ │ └── source-map@0.5.6
│ ├─┬ tsconfig@5.0.3
│ │ ├── any-promise@1.3.0
│ │ ├─┬ parse-json@2.2.0
│ │ │ └─┬ error-ex@1.3.0
│ │ │   └── is-arrayish@0.2.1
│ │ ├─┬ strip-bom@2.0.0
│ │ │ └── is-utf8@0.2.1
│ │ └── strip-json-comments@2.0.1
│ └── xtend@4.0.1
├─┬ tslint@3.13.0
│ ├─┬ findup-sync@0.3.0
│ │ └── glob@5.0.15
│ └─┬ underscore.string@3.3.4
│   └── util-deprecate@1.0.2
├── typescript@2.0.10
└── zone.js@0.6.26
```
