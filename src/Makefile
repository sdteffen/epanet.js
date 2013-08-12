epanet_sources = epanet.c hash.c hydraul.c \
	inpfile.c input1.c input2.c input3.c mempool.c output.c \
	quality.c report.c rules.c smatrix.c
 
epanet_headers = enumstxt.h epanet2.h funcs.h hash.h mempool.h text.h \
	toolkit.h types.h vars.h

epanet_js = pre.js library.js shell.html

d3epanet_js = pre.js library.js d3shell.html

all: epanet.html

epanet.js: $(epanet_sources) $(epanet_headers)
	emcc -O1 $(epanet_sources) -o epanet.js --embed-file simple.inp

epanet.html: $(epanet_sources) $(epanet_headers) $(epanet_js)
	emcc -O1 $(epanet_sources) -o epanet.html \
	--pre-js pre.js --shell-file shell.html
	
d3epanet.html: $(epanet_sources) $(epanet_headers) $(d3epanet_js)
	emcc -O1 $(epanet_sources) -o d3epanet.html \
	--pre-js pre.js --shell-file d3shell.html --js-library library.js

clean:
	-rm -f epanet.js
	-rm -f epanet.html
	-rm -f d3epanet.html

