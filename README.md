# IOTA Flash Server

This project basically wraps IOTA flash functionalities inside an Express web server, which makes it possible to build non-Javascript Flash applications.

## Docker Build/Run

Run and build the application with

```
docker build -t <TAG_NAME> .
docker run --rm -it -p "3000:3000" -e "IOTA_SEED=<SEED>" <TAG_NAME>
```

The server is then reachable on `http://localhost:3000`. Please have a look at `server.js` and `example/client.py` to get an overview of the implemented functionalities.

**Example**:

```
docker build -t jinnerbichler/flash-server .
docker run --rm -it -p "3001:3000" -e "IOTA_SEED=USERTWOUSERTWOUSERTWOUSERTWOUSERTWOUSERTWOUSERTWOUSERTWOUSERTWOUSERTWOUSERTWOUSER" jinnerbichler/flash-server
```

## Example Setup

Run

```
docker-compose.yml up --build
```

in order to execute the example application in `example/client.py`.
It basically sets up two Flash server for two different users and performs a transfer.
