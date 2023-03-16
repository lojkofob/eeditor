cmake_minimum_required ( VERSION 2.6 )

##########################################################################################
# Process subdirectories

add_subdirectory ( ZLib )
add_subdirectory ( LibJPEG )
add_subdirectory ( LibPNG )

##########################################################################################
# Declaration of the library

# List the source files
set(SRCS FreeImage/BitmapAccess.cpp
         FreeImage/CacheFile.cpp
         FreeImage/ColorLookup.cpp
         FreeImage/Conversion.cpp
         FreeImage/Conversion16_555.cpp
         FreeImage/Conversion16_565.cpp
         FreeImage/Conversion24.cpp
         FreeImage/Conversion32.cpp
         FreeImage/Conversion4.cpp
         FreeImage/Conversion8.cpp
         FreeImage/ConversionRGBF.cpp
         FreeImage/ConversionRGB16.cpp
         FreeImage/ConversionType.cpp
         FreeImage/ConversionFloat.cpp
         FreeImage/ConversionUINT16.cpp
         FreeImage/FreeImage.cpp
         FreeImage/FreeImageIO.cpp
         FreeImage/GetType.cpp
         FreeImage/Halftoning.cpp
#          FreeImage/J2KHelper.cpp
         FreeImage/MemoryIO.cpp
         FreeImage/MultiPage.cpp
         FreeImage/NNQuantizer.cpp
         FreeImage/PSDParser.cpp
         FreeImage/PixelAccess.cpp
         FreeImage/Plugin.cpp
#         FreeImage/PluginBMP.cpp
#         FreeImage/PluginCUT.cpp
#         FreeImage/PluginDDS.cpp
#          FreeImage/PluginEXR.cpp
#          FreeImage/PluginG3.cpp
#         FreeImage/PluginGIF.cpp
#         FreeImage/PluginHDR.cpp
#         FreeImage/PluginICO.cpp
#         FreeImage/PluginIFF.cpp
#          FreeImage/PluginJ2K.cpp
#          FreeImage/PluginJP2.cpp
         FreeImage/PluginJPEG.cpp
        #  FreeImage/PluginJXR.cpp
#         FreeImage/PluginKOALA.cpp
#         FreeImage/PluginMNG.cpp
#         FreeImage/PluginPCD.cpp
#         FreeImage/PluginPCX.cpp
#         FreeImage/PluginPFM.cpp
#         FreeImage/PluginPICT.cpp
         FreeImage/PluginPNG.cpp
#         FreeImage/PluginPNM.cpp
#         FreeImage/PluginPSD.cpp
#         FreeImage/PluginRAS.cpp
#          FreeImage/PluginRAW.cpp
         FreeImage/PluginSGI.cpp
         FreeImage/PluginTARGA.cpp
#          FreeImage/PluginTIFF.cpp
#         FreeImage/PluginWBMP.cpp
#         FreeImage/PluginXBM.cpp
#         FreeImage/PluginXPM.cpp
         FreeImage/TIFFLogLuv.cpp
         FreeImage/ToneMapping.cpp
         FreeImage/WuQuantizer.cpp
         FreeImage/ZLibInterface.cpp
         FreeImage/tmoColorConvert.cpp
         FreeImage/tmoDrago03.cpp
         FreeImage/tmoFattal02.cpp
         FreeImage/tmoReinhard05.cpp
         FreeImageToolkit/BSplineRotate.cpp
         FreeImageToolkit/Background.cpp
         FreeImageToolkit/Channels.cpp
         FreeImageToolkit/ClassicRotate.cpp
         FreeImageToolkit/Colors.cpp
         FreeImageToolkit/CopyPaste.cpp
         FreeImageToolkit/Display.cpp
         FreeImageToolkit/Flip.cpp
         FreeImageToolkit/JPEGTransform.cpp
         FreeImageToolkit/MultigridPoissonSolver.cpp
         FreeImageToolkit/Rescale.cpp
         FreeImageToolkit/Resize.cpp
         Metadata/Exif.cpp
         Metadata/FIRational.cpp
         Metadata/FreeImageTag.cpp
         Metadata/IPTC.cpp
         Metadata/TagConversion.cpp
         Metadata/TagLib.cpp
#          Metadata/XTIFF.cpp
)

set (HDRS
	
	CacheFile.h
	FreeImage.h
	FreeImageIO.h
	Plugin.h
	Quantizers.h
	ToneMapping.h
	Utilities.h

	Metadata/FIRational.h
	Metadata/FreeImageTag.h
)


project(FreeImage)

# List the include paths
include_directories(${CMAKE_CURRENT_SOURCE_DIR}
                    ${CMAKE_CURRENT_SOURCE_DIR}/DeprecationManager
                    ${CMAKE_CURRENT_SOURCE_DIR}/ZLib
                    ${CMAKE_CURRENT_SOURCE_DIR}/LibJPEG
)


set_source_files_properties ( ${SRCS} PROPERTIES COMPILE_FLAGS "-w" )

set(CMAKE_C_FLAGS "${CMAKE_CFLAGS} -std=c99 -O3 -fPIC -fexceptions -fvisibility=hidden")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fPIC")

add_library ( FreeImage STATIC ${SRCS} ${HDRS} )

target_link_libraries ( FreeImage jpeg png )
add_dependencies ( FreeImage LibJPEG LibPNG )

