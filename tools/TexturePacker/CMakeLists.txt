cmake_minimum_required(VERSION 3.2)

set(PROJECT_NAME TexturePacker)

# set(CMAKE_C_COMPILER "/usr/bin/clang")
# set(CMAKE_CXX_COMPILER "/usr/bin/clang++")

set(PROJECT_COPYRIGHT "Copyright (c) Edgar Shpengler 2022")

project(${PROJECT_NAME})

set (CMAKE_PROJECT_VERSION "")
set (CMAKE_PROJECT_VERSION_MAJOR "")
set (CMAKE_PROJECT_VERSION_MINOR "")
set (CMAKE_PROJECT_VERSION_PATCH "")

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++17")
set(CMAKE_CXX_STANDARD 17)
# add_definitions (-DRC_INVOKED )
add_definitions (-D_AMD64_)
add_definitions (-D_ITERATOR_DEBUG_LEVEL=0) 
# add_definitions (-D__LP64__=1) 

add_subdirectory (3rdparty/FreeImage)

set (
	SOURCES

	${CMAKE_CURRENT_SOURCE_DIR}/src/json/jsmn.c
	${CMAKE_CURRENT_SOURCE_DIR}/src/json/utf8.cpp
	${CMAKE_CURRENT_SOURCE_DIR}/src/json/value.cpp

	${CMAKE_CURRENT_SOURCE_DIR}/src/GuillotineBinPack.cpp
	${CMAKE_CURRENT_SOURCE_DIR}/src/MaxRectsBinPack.cpp
	${CMAKE_CURRENT_SOURCE_DIR}/src/Rect.cpp
	${CMAKE_CURRENT_SOURCE_DIR}/src/ShelfBinPack.cpp
	${CMAKE_CURRENT_SOURCE_DIR}/src/SkylineBinPack.cpp
	${CMAKE_CURRENT_SOURCE_DIR}/src/main.cpp
)

if (${WIN32})
set (SOURCES ${SOURCES} ${CMAKE_CURRENT_SOURCE_DIR}/src/getopt.c)
endif (${WIN32})

include_directories (${CMAKE_CURRENT_SOURCE_DIR}/3rdparty/FreeImage)
include_directories (${CMAKE_CURRENT_SOURCE_DIR}/src)
include_directories (${CMAKE_CURRENT_SOURCE_DIR}/src/include)
include_directories (${CMAKE_CURRENT_SOURCE_DIR}/src/json)
include_directories (${CMAKE_CURRENT_SOURCE_DIR}/src/lib)

add_executable (${PROJECT_NAME} ${SOURCES})
target_link_libraries (${PROJECT_NAME} FreeImage)
