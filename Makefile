# TODO:
# create targets descriptions

VERSION=1.0.0
BUILD_D=./build/$(VERSION)/bin
w?=2048
h?=2048
ifeq ($(OS),Windows_NT)
   TEXTURE_PACKER_OPTIONS=--tmpDir C:/tmp/
endif
	
ATLAS:
 	bash ./tools/TexturePacker/TexturePacker -a -v -w ${w} -h ${h} -m atlas-%d ./img/
	
SOUNDS:
	node ./tools/soundsprite -e mp3 -o sounds -d ./ ./sounds/*
	
