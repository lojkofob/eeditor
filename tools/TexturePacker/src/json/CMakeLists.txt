cmake_minimum_required (VERSION 2.8.8)

project (json)

set (
	json_sources

	${json_SOURCE_DIR}/jsmn.c
	${json_SOURCE_DIR}/utf8.cpp
	${json_SOURCE_DIR}/value.cpp
)

include_directories (${json_SOURCE_DIR})

add_library (json STATIC ${json_sources})
