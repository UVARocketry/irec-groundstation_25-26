#include <iostream>
#include <vector>
int main() {
  std::vector<int> v = {1, 2, 3, 4, 6};
  // indices start at 0 (NOT 1)
  int index = 0;
  // you can access vector items by number
  std::cout << v[index] << std::endl; // prints 1
  std::cout << v[0] << std::endl;     // also prints 1
  std::cout << v[1] << std::endl;     // prints 2
  // you get the size of a vector by calling .size()
  std::cout << v.size() << std::endl; // prints 5
  // this will always get you the last item in a vector
  std::cout << v[v.size() - 1] << std::endl; // prints 6

  // common pattern for looping over every item in a vector
  // prints 1
  // 2
  // 3
  // 4
  // 6
  for (int i = 0; i < v.size(); i++) {
    std::cout << v[i] << std::endl;
  }
}
