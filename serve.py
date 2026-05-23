import http.server, os
os.chdir("/Users/andrewcamilleri/Downloads/SITEWORK - SaaS")
http.server.test(HandlerClass=http.server.SimpleHTTPRequestHandler, port=3456, bind="127.0.0.1")
