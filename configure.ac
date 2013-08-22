#                                               -*- Autoconf -*-
# Process this file with autoconf to produce a configure script.

AC_PREREQ([2.69])
AC_INIT([epanet.js], [2.0.12.1], [https://github.com/sdteffen/epanet.js/issues])
AM_INIT_AUTOMAKE(AC_PACKAGE_NAME,AC_PACKAGE_VERSION)

# Checks for programs.
AC_CHECK_PROG(EMCC, emcc,emcc, none)
if test "$EMCC" = none; then
    AC_MSG_ERROR([emcc C-to-JS compiler not found: $EMCC.
      See http://www.emscripten.org])
fi

AC_CONFIG_FILES([Makefile src/Makefile src/css/Makefile src/fonts/Makefile
    src/js/Makefile src/samples/Makefile]
)
AC_OUTPUT
