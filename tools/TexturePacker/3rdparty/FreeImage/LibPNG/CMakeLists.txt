# List the source files
set(SRCS png.c
         pngerror.c
         #pnggccrd.c
         pngget.c
         pngmem.c
         pngpread.c
         pngread.c
         pngrio.c
         pngrtran.c
         pngrutil.c
         pngset.c
         pngtrans.c
         #pngvcrd.c
         pngwio.c
         pngwrite.c
         pngwtran.c
         pngwutil.c
)

project(png)

include_directories(${CMAKE_CURRENT_SOURCE_DIR}/../ZLib)

add_library(png STATIC ${SRCS})

target_link_libraries(png z)
