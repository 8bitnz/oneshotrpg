# serve.py — static server for Embervale plus a POST /__shot endpoint that
# saves canvas screenshots from the in-page test harness (EV_TEST.shot()).
# Dev/testing only; the game itself is fully static.
import base64
import http.server
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, '.shots')
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8471


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_POST(self):
        if self.path.startswith('/__shot'):
            length = int(self.headers.get('Content-Length', 0))
            data = self.rfile.read(length).decode('ascii', 'ignore')
            b64 = data.split(',', 1)[1] if ',' in data else data
            m = re.search(r'name=([\w-]+)', self.path)
            name = m.group(1) if m else 'shot'
            os.makedirs(OUT, exist_ok=True)
            path = os.path.join(OUT, name + '.png')
            with open(path, 'wb') as f:
                f.write(base64.b64decode(b64))
            self.send_response(200)
            self.end_headers()
            self.wfile.write(path.encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, *args):
        pass


if __name__ == '__main__':
    http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
