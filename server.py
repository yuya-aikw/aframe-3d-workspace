from http.server import HTTPServer, SimpleHTTPRequestHandler
import ssl

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
    ctx.load_cert_chain('localhost.pem', keyfile='localhost-key.pem')
    ctx.options |= ssl.OP_NO_TLSv1 | ssl.OP_NO_TLSv1_1
    handler = SimpleHTTPRequestHandler

    run(host, port, ctx, handler)
