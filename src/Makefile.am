epanet_sources = epanet.c hash.c hydraul.c \
	inpfile.c input1.c input2.c input3.c mempool.c output.c \
	quality.c report.c rules.c smatrix.c
 
epanet_headers = enumstxt.h epanet2.h funcs.h hash.h mempool.h text.h \
	toolkit.h types.h vars.h

d3epanet_js = js/pre.js js/library.js shell.html

EXTRA_DIST = $(epanet_sources) $(epanet_headers) shell.html

SUBDIRS = css fonts js samples

all: js.html
	
js.html: $(epanet_sources) $(epanet_headers) $(d3epanet_js)
	emcc -O1 $(epanet_sources) -o js.html \
	--pre-js js/pre.js --shell-file shell.html --js-library js/library.js \
	-s EXPORTED_FUNCTIONS="['_main', '_hour']"

clean:
	-rm -f js.html
