import http.server
import os
from urllib.parse import unquote


class MyHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        if path == "" or path == "/":
            return os.path.join(os.getcwd(), "index.html")
        # Decode the URL-encoded path
        path = unquote(path)
        # Remove the leading '/folder1' part
        return os.path.join(os.getcwd(), path.lstrip("/"))


if __name__ == "__main__":
    port = 3000
    server_address = ("", port)
    httpd = http.server.HTTPServer(server_address, MyHandler)
    print(f"Serving on http://localhost:{port}")
    httpd.serve_forever()
