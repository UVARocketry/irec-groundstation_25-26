cmake_minimum_required(VERSION 3.12)
cmake_policy(SET CMP0076 NEW)

project(Strelka C CXX) 

set(CMAKE_C_STANDARD 99)
set(CMAKE_CXX_STANDARD 20)

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/$<CONFIGURATION>")
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/$<CONFIGURATION>")


add_subdirectory(./libs/glm EXCLUDE_FROM_ALL)
add_subdirectory(./libs/sdl EXCLUDE_FROM_ALL)
find_package(OpenGL)
include_directories(${CMAKE_SOURCE_DIR}/libs/imgui)
include_directories(${CMAKE_SOURCE_DIR}/libs/imgui/backends)

#add the main executable file
add_executable(Strelka main.cpp)


# target_sources(
#     Strelka 

#     #engine


#     PUBLIC ${CMAKE_SOURCE_DIR}/engine/engine.cpp 

#     PUBLIC ${ModuleSources}


# )

#gl mathematics
target_link_libraries(Strelka PUBLIC glm)

#imgui
# target_link_libraries(Strelka PUBLIC imgui)

#sdl
target_link_libraries(Strelka PRIVATE SDL3::SDL3)
set_target_properties(Strelka PROPERTIES BUILD_RPATH "$ORIGIN")

#opengl
target_link_libraries(Strelka PUBLIC ${OPENGL_LIBRARIES})
target_include_directories(Strelka PUBLIC ${OPENGL_INCLUDE_DIR})



#regular engine headers
target_include_directories(
    Strelka
    PRIVATE
)




