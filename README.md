# synthetic loot viewer

View synthetic loot by wallet address or ENS

## References
* Images - https://github.com/jordanmessina/loot-layers

## Running the Dapp

This project uses [`create-react-app`](https://create-react-app.dev/), so most
configuration files are handled by it.

To run it, you just need to execute `yarn start` in a terminal, and open
[http://localhost:3000](http://localhost:3000).

To learn more about what `create-react-app` offers, you can read
[its documentation](https://create-react-app.dev/docs/getting-started).

### Deploy client to IPFS using [ipfs-deploy](https://github.com/ipfs-shipyard/ipfs-deploy)

1. Install ipfs-deploy
```
npm install -g ipfs-deploy
```

2. Deploy app
```
npx ipfs-deploy build
```

3. Visit the HTTP gateway URL to check if it worked.

