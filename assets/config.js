// This file overwrites the stock UV config.js

self.__uv$config = {
  prefix: "/harriubg/harriubg/",
  bare: "/bare/",
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,
  handler: "/harriubg/handler.js",
  client: "/harriubg/client.js",
  bundle: "/harriubg/bundle.js",
  config: "/harriubg/config.js",
  sw: "/harriubg/rizz.sw.js",
};
