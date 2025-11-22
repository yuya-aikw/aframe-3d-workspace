from http.server import HTTPServer, SimpleHTTPRequestHandler
import ssl

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="out", **kwargs)


def run(host, port, ctx, handler):
    server = HTTPServer((host, port), handler)
    server.socket = ctx.wrap_socket(server.socket)
    print('Server Starts - %s:%s' % (host, port))

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()
    print('Server Stops - %s:%s' % (host, port))

if __name__ == '__main__':
    host = '0.0.0.0'
    port = 3000

    ctx = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    ctx.load_cert_chain('192.168.1.160+3.pem', keyfile='192.168.1.160+3-key.pem')
    ctx.options |= ssl.OP_NO_TLSv1 | ssl.OP_NO_TLSv1_1
    handler = Handler

    run(host, port, ctx, handler)
