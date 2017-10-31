# To run/develop locally

[Node](https://nodejs.org/) 7.6.0+ required.

```sh
git clone https://github.com/TehShrike/susd-search-site.git
cd susd-search-site
npm install
npm run build
npm run startdev
```

The server should be running at [localhost:8888](http://localhost:8888/).

That's all you should need to do to run it locally.  If that doesn't work for you, open an issue to let me know.

To develop the client side app, run `npm run watch` in another terminal window to have a process automatically watch for changes and rebuild the client app when necessary.

### Docker
Alternatively, you can build and run the app using Docker:
```sh
docker build -t susd-search .
docker run -p 8888:8888 susd-search
```
which also makes the server run at [localhost:8888](http://localhost:8888/).

# Image server

The automatically-resized-images server code is at [susd-image-mirror](https://github.com/TehShrike/susd-image-mirror).

If you want to point to a locally-running image server, set `imageServer` in `config.js` to something like `//localhost:8889/`.
