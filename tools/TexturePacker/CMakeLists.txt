cmake_minimum_required(VERSION 3.2...4.3.3)

set(PROJECT_NAME TexturePacker)

# set(CMAKE_C_COMPILER "/usr/bin/clang")
# set(CMAKE_CXX_COMPILER "/usr/bin/clang++")

set(PROJECT_COPYRIGHT "Copyright (c) Edgar Shpengler 2022")

project(${PROJECT_NAME}
    VERSION 0.0.0
    DESCRIPTION "Texture packer tool"
    LANGUAGES C CXX
)

set (CMAKE_PROJECT_VERSION "")
set (CMAKE_PROJECT_VERSION_MAJOR "")
set (CMAKE_PROJECT_VERSION_MINOR "")
set (CMAKE_PROJECT_VERSION_PATCH "")

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Platform-specific definitions
if(MSVC)
    add_definitions(-D_AMD64_)
    add_definitions(-D_ITERATOR_DEBUG_LEVEL=0)
else()
    add_definitions(-D_AMD64_)
    add_definitions(-D_ITERATOR_DEBUG_LEVEL=0)
endif()

# add_definitions (-DRC_INVOKED)
# add_definitions (-D__LP64__=1)

add_subdirectory(3rdparty/FreeImage)

set(
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

if(WIN32)
    set(SOURCES ${SOURCES} ${CMAKE_CURRENT_SOURCE_DIR}/src/getopt.c)
endif()

include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/3rdparty/FreeImage
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/src/include
    ${CMAKE_CURRENT_SOURCE_DIR}/src/json
    ${CMAKE_CURRENT_SOURCE_DIR}/src/lib
)

add_executable(${PROJECT_NAME} ${SOURCES})
target_link_libraries(${PROJECT_NAME} PRIVATE FreeImage)