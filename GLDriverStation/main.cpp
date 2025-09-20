#include "SDL3/SDL.h"
#include <iostream>
#include <string>
#include <vector>

int main() {

    SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO | SDL_INIT_JOYSTICK);
    SDL_Window* window = SDL_CreateWindow("StrelkaVisualizer", 1280, 720, SDL_WINDOW_OPENGL);

    SDL_Event event;
    bool running = true;
    while (running) {

        SDL_PollEvent(&event);
        if (event.type == SDL_EVENT_QUIT) {
            abort();
        }

    }

}
