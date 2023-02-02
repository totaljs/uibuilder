ECHO "[COMPILING]"
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cd $DIR
uglifyjs ../public/js/uibuilder.js --config-file minify.json -o uibuilder.min@1.js