#define GL_GLEXT_PROTOTYPES
#include "SDL3/SDL.h"
#include "SDL3/SDL_opengl.h"
#include <iostream>
#include <vector>


#include "glm/glm.hpp"
#include "glm/gtc/matrix_transform.hpp"
#include "glm/gtc/type_ptr.hpp"

glm::vec3 vertices[3] = {
    {-0.5f,  0.5f,  0.0f},
    {-0.5f, -0.5f,  0.0f},
    { 0.5f, -0.5f,  0.0f}
};

std::string v_shader_text = R"(

#version 330 core
layout (location = 0) in vec4 vertex_position;

void main()
{
    gl_Position = vertex_position;
}

)";

std::string f_shader_text = R"(

#version 330 core
out vec4 FragColor;

void main()
{
    FragColor = vec4(1.0f, 1.0f, 1.0f, 1.0f);
} 

)";

unsigned int createShader(std::string v, std::string f) {

    unsigned int vs = glCreateShader(GL_VERTEX_SHADER);
    unsigned int fs = glCreateShader(GL_FRAGMENT_SHADER);

    const char* vtx_cstr = v.c_str();
    const char* frg_cstr = f.c_str();

    glShaderSource(vs, 1, &(vtx_cstr), nullptr);
    glCompileShader(vs);
    int sv = false;
    glGetShaderiv(vs, GL_COMPILE_STATUS, &sv);
    if (sv == false) {
        std::cout << "Vertex Shader Errors:" << std::endl;
        char errors[512] = "";
        glGetShaderInfoLog(vs, 512, nullptr, errors);
        std::cout << errors << std::endl;
        abort();
    }


    glShaderSource(fs, 1, &(frg_cstr), nullptr);
    glCompileShader(fs);
    int sf = false;
    glGetShaderiv(fs, GL_COMPILE_STATUS, &sf);
    if (sf == false) {
        std::cout << "Fragment Shader Errors:" << std::endl;
        char errors[512] = "";
        glGetShaderInfoLog(fs, 512, nullptr, errors);
        std::cout << errors << std::endl;
        abort();
    }

    unsigned int p;
    p = glCreateProgram();
    glAttachShader(p, vs);
    glAttachShader(p, fs);
    glLinkProgram(p);
    glValidateProgram(p);
    char info[512] = "";
    glGetProgramInfoLog(p, 512, nullptr, info);
    std::cout << info << std::endl;
    glDeleteShader(vs);
    glDeleteShader(fs);
    return p;

}

void checkError() {

    unsigned int e = glGetError();

    std::cout << e << std::endl;

    if (e!=0) {
        abort();
    }
}

int main() {

    SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO | SDL_INIT_JOYSTICK);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 3);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 3);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, GL_CONTEXT_CORE_PROFILE_BIT);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_FLAGS, SDL_GL_CONTEXT_FORWARD_COMPATIBLE_FLAG);
    SDL_GL_SetAttribute(SDL_GL_STENCIL_SIZE, 8);

    SDL_Window* window = SDL_CreateWindow("StrelkaVisualizer", 1280, 720, SDL_WINDOW_OPENGL);
    SDL_GLContext ctx = SDL_GL_CreateContext(window);
    SDL_GL_MakeCurrent(window, ctx);
    // glEnable(GL_DEPTH_TEST);
    SDL_GL_SetSwapInterval(1);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);

    unsigned int vao;
    unsigned int vbo;
    glGenVertexArrays(1, &vao);
    glGenBuffers(1, &vbo);
    
    glBindVertexArray(vao);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glEnableClientState(GL_VERTEX_ARRAY);


    glBufferData(GL_ARRAY_BUFFER, 3*sizeof(glm::vec3), &vertices, GL_STATIC_DRAW);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(glm::vec3), 0);
    glEnableVertexAttribArray(0);


    unsigned int prog = createShader(v_shader_text, f_shader_text);

    SDL_Event event;
    bool running = true;
    while (running) {

        SDL_PollEvent(&event);
        if (event.type == SDL_EVENT_QUIT) {
            exit(0);
        }
    
        glBindVertexArray(vao);
        glBindBuffer(GL_ARRAY_BUFFER, vbo);

        glBindVertexArray(vao);
        glBindBuffer(GL_ARRAY_BUFFER, vbo);
        glUseProgram(prog);

        glClearColor(0.2, 0.2, 0.3, 1.0);
        glClear(GL_COLOR_BUFFER_BIT);  
        glViewport(0, 0, 1280, 720);

        glDrawArrays(GL_TRIANGLES, 0, 3);
        std::cout << glGetError() << std::endl;

        SDL_GL_SwapWindow(window);

    }

}
