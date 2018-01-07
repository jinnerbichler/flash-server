# Generic IOTA Flash Server

This project basically wraps generic IOTA flash functionalities inside an Express web server, which makes it possible to build non-Javascript Flash applications.

**IMPORTANT:** Please clone the repository in a recursive manner (i.e. `git clone --recursive https://github.com/jinnerbichler/flash-server`) in order to get all submodles in one shot.

## Configuration Parameters

The following configrations can be done via setting the proper environment variable:

* `IOTA_SEED`(required): Seed of this Flash server (should never leave server)
* `IRI_HOST`(optional): Host of IRI node. Must be set if interacting with the Tangle (e.g. `/fund` or `/finalize` API calls)
* `IRI_PORT`(optional): Port of IRI node. Must be set if interacting with the Tangle (e.g. `/fund` or `/finalize` API calls)
* `IRI_TESTNET`(optional, default=false): Testnet flag of IRI node.
* `AUTH_USERNAME` (optional): Username of HTTP Basic authentication
* `AUTH_PASSWORD` (optional): Password of HTTP Basic authentication

**HTTP Basic Authentication** cat be activated by setting `AUTH_USERNAME` and `AUTH_PASSWORD`..

## Docker Build

Run and build the application with

```
docker build -t <TAG_NAME> .
docker run --rm -it -p "3000:3000" -e "IOTA_SEED=<SEED>" <TAG_NAME>
```

The server is then reachable on `http://localhost:3000`. Please have a look at `server.js` and `example/client.py` to get an overview of the implemented functionalities.

**Executable Example**:

```
docker build -t jinnerbichler/flash-server .
docker run --rm -it -p "3001:3000" -e "IOTA_SEED=USERTWOUSERTWOUSERTWOUSERTWOUSERTWOUSERTWOUSERTWOUSERTWOUSERTWOUSERTWOUSERTWOUSER" jinnerbichler/flash-server
```

### Demonstration Setup

Run

```
docker-compose up --build
```

in order to execute the example application in `example/client.py`.
It basically sets up two Flash server for two different users and performs a transfer.

## API Documentation

In general the current state of the Flash channel is stored on the server. In this way the exchange of state objects is avoided.

### /init

Initializes the Flash channel

* Type: `POST`
* Content-Type: `application/json`
* Payload: Parameters of channel to be initialized
* Response: Intialized Flash object of user

**Example payload:**

```
{
	"userIndex": 1,
	"index": 1,
    "security": 1,
    "depth": 3,
	"signersCount": "2",
	"balance": 4000,
	"deposit": [3000, 1000]
}
```

### /multisignature

Generates multisignature addresses

* Type: `POST`
* Content-Type: `application/json`
* Payload: Digests of all participating users
* Response: Chained addresses for intitial tree branches

**Example payload:**

```
{  
   "allDigests":[  
      [  
         {  
            "digest":"SWAXQJ9RMQVQWVDIJMQNWTYBJCVQAXFBHRFVDNPPNERPIHUDVNRBCWOQWQEDQQMXGRDIEUWNJ9EMHRBMXRYMXBLHZTLZRVCFBWAYTGRDQQREXUQPHMMDWMUVPFDCTETLXHPEMUZMKPBHFKGEIHLJWZDEXYJXKZPPJW",
            "security":2,
            "index":0
         },
         ...
      [  
         {  
            "digest":"BFYVAZT9YWCMPJYQZK9ETDXMBHEGDGRSKCVJMPWTSEIEWVTBBSTBDCMYONNGJTDYIENFJUIVSWJYNNFH9IGGSPDYSG9LRVYSLIODFSCWRFSIGDJQCQAUAQLLFYJAEZDZEFBIPTPZ9LDHHQQEBFCPYNBDQNYYTXAQQB",
            "security":2,
            "index":0
         },
     	  ...
      ]
   ]
}
```

### /settlement

Sets settlementment addresses for each user

* Type: `POST`
* Content-Type: `application/json`
* Payload: Settlements addresses of all users
* Response: Updated Flash object of user

**Example payload:**

```
{
	"settlementAddresses": [
		"USERONE9ADDRESS9USERONE9ADDRESS9USERONE9ADDRESS9USERONE9ADDRESS9USERONE9ADDRESS9U",
		"USERTWO9ADDRESS9USERTWO9ADDRESS9USERTWO9ADDRESS9USERTWO9ADDRESS9USERTWO9ADDRESS9U"
	]
}
```

### /transfer

Initiates a transfer between parties in the channel.

* Type: `POST`
* Content-Type: `application/json`
* Payload: List of transfers
* Response: List of generated bundles

**Example payload:**

```
{  
   "transfers":[  
      {  
         "value":200,
         "address":"USERONE9ADDRESS9USERONE9ADDRESS9USERONE9ADDRESS9USERONE9ADDRESS9USERONE9ADDRESS9U"
      }
   ]
}
```

### /sign

Signs bundles (e.g. one returned from `/transfer`)

* Type: `POST`
* Content-Type: `application/json`
* Payload: List of bundles to be signed
* Response: List of signed bundles

**Example payload:**

```
{  
   "bundles":[  
      [  
         {  
            "address":"GOWCBEVGFYPOCYUREVXAHCMLGOUOGDYNC...",
            "value":2000,
            "obsoleteTag":"XB9999999999999999999999999",
            "tag":"999999999999999999999999999",
            "timestamp":1514839104,
            "currentIndex":0,
            "lastIndex":4,
            "bundle":"GLINURCSTLFVVIZIEAO9CPLSLAQKVNTEXN...",
            "signatureMessageFragment":"9999....",
            "trunkTransaction":"99999999999...",
            "branchTransaction":"99999999999...",
            "attachmentTimestamp":"999999999",
            "attachmentTimestampLowerBound":"999999999",
            "attachmentTimestampUpperBound":"999999999",
            "nonce":"999999999999999999999999999"
         },
         ...
      ],
      ...
   ]
}
```



### /apply

Validates and applies signed bundles

* Type: `POST`
* Content-Type: `application/json`
* Payload: List of signed bundles to be applied to Flash object
* Response: Updated Flash object of user

**Example payload:**

```
{  
   "bundles":[  
      [  
         {  
            "address":"KGGRUEBATPOQXH9VSAFVZT9BXEMFN...",
            "value":-2000,
            "obsoleteTag":"999999999999999999999999999",
            "tag":"999999999999999999999999999",
            "timestamp":1514839104,
            "currentIndex":1,
            "lastIndex":4,
            "bundle":"GLINURCSTLFVVIZIEAO9CPLSLAQKVNTEXNWHEYLKHK...",
            "signatureMessageFragment":"SNFPTXHWMCMJGCKLYEEIVUWIN...",
            "trunkTransaction":"99999999999999...",
            "branchTransaction":"9999999999999...",
            "attachmentTimestamp":"999999999",
            "attachmentTimestampLowerBound":"999999999",
            "attachmentTimestampUpperBound":"999999999",
            "nonce":"999999999999999999999999999"
         },
         ...
      ],
      ...
   ]
}
```

### /close

Closes the channel by computing final bundles

* Type: `POST`
* Content-Type: `application/json`
* Payload: no payload
* Response: List of final bundles

### /fund

Transfers aggreed amount to users deposit address. 

* Type: `POST`
* Content-Type: `application/json`
* Payload: no payload
* Response: List of executed transactions

**Note:** Requires interaction with an IRI node.

### /finalize

Performs proper transfers after the channel was closed. 

* Type: `POST`
* Content-Type: `application/json`
* Payload: no payload
* Response: List of executed transactions

**Note:** Requires interaction with an IRI node.

### /flash

* Type: `GET`
* Response: Current state of Flash channel (i.e. Flash object)

### /balance

* Type: `GET`
* Response: Remaining balance of user
