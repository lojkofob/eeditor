cmake_minimum_required(VERSION 3.2...4.3.3)

project(json
    VERSION 1.0.0
    DESCRIPTION "JSON parser library"
    LANGUAGES C CXX
)

set(
    json_sources
    ${json_SOURCE_DIR}/jsmn.c
    ${json_SOURCE_DIR}/utf8.cpp
    ${json_SOURCE_DIR}/value.cpp
)

# Note: json_SOURCE_DIR should be defined before including this file
# or you can set it here if needed:
# set(json_SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR})

add_library(json STATIC ${json_sources})

target_include_directories(json PRIVATE
    ${json_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}
)

# Optional: Set C++ standard if needed for utf8.cpp and value.cpp
set_target_properties(json PROPERTIES
    CXX_STANDARD 11
    CXX_STANDARD_REQUIRED OFF
)

# Optional: Suppress warnings for jsmn.c if needed
# set_source_files_properties(${json_SOURCE_DIR}/jsmn.c PROPERTIES COMPILE_FLAGS "-w")