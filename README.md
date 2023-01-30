# io-game over WebSockets for project days

## About

We are trying to build a simple io-game (our main inspriations are agar.io,
diep.io and surviv.io). The game has just one mode called battle royale (all
players play against all players, last standing wins).

We log our progress in a board on [our Notion page](https://marat-isaw.notion.site/35d705d6c6db4bd6ac6cf6e7a8232735?v=8252daf928ae4b45b8853b5edb86850e)

### Tech

The project is built in JavaScript using following technologies:

* [Express](https://expressjs.com): Used for the server
* [Socket.IO](https://socket.io): Library of choice for sending data between
  client and server, builts upon WebSockets
* [bitECS](https://github.com/NateTheGreatt/bitECS): Used for ECS architecture,
  it's easy to use, fast and supports serialization for sending data over the
  web.

### Authors

* Thomas Fischer (@Dumgespielt)
* Paul Trattnig (@Razer72)
* Marat Isaw (@xyl1t)
* Benjamin Terbul (@Benidxd5)
* Justus Arndt (@Guntur1400)

## Run

Clone the repo and run

```sh
npm i
npm start
```

For dev purposes you can also run

```sh
npm run dev
```

You can optionally pass a parameter called `--port` which sets the port to
something other than `8080`.

The server will be running at `0.0.0.0` on port `8080`, if not specified
otherwise. In order to join the game open a browser and enter your IP with port
in the search bar, e.g.: `localhost:8080`
