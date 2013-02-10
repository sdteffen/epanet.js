epanet_sources = epanet.c hash.c hydraul.c \
	inpfile.c input1.c input2.c input3.c mempool.c output.c \
	quality.c report.c rules.c smatrix.c
 
epanet_headers = enumstxt.h epanet2.h funcs.h hash.h mempool.h text.h \
	toolkit.h types.h vars.h 

all: epanet.js

epanet.js: $(epanet_sources) $(epanet_headers)
	emcc -O1 $(epanet_sources) -o epanet.js --embed-file simple.inp 

epanet.html: $(epanet_sources) $(epanet_headers)
	emcc -O1 $(epanet_sources) -o epanet.html --embed-file simple.inp \
	--pre-js pre.js

clean:
	rm epanet.js	
