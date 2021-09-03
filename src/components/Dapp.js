import React from "react"
import { withRouter, Switch, Route, matchPath } from "react-router"
import { ethers } from "ethers"

import deploymentMap from "../deployments/map.json"
import SyntheticLootArtifact from "../artifacts/contracts/SyntheticLoot/SyntheticLoot.json"

import {getImageForLoot, itemsFromSvg} from "./../loot-util"

import { Nav } from "./Nav"
import HeaderUser from "./HeaderUser"

import "./App.css"
import "./Spinner.css"

async function getChainId(provider) {
  const network = await provider.getNetwork()
  let chainId = network.chainId
  chainId = parseInt(chainId)
  return chainId
}

class Dapp extends React.Component {
  constructor(props) {
    super(props)

    this.initialState = {
      syntheticLoot: undefined,
      currentUser: undefined,
      displayedUser: undefined,
      lootImage: undefined,
      searchQuery: "",
      userNotFound: false,
      ready: undefined,
      networkError: undefined,
      isConnectingWallet: false,
      canConnectWallet: false,
      isLoading: false
    }

    this.state = this.initialState

    this._onSearch = this._onSearch.bind(this)
    this._onSearchChange = this._onSearchChange.bind(this)
    this._onSelectUser = this._onSelectUser.bind(this)
    this._userFromAddress = this._userFromAddress.bind(this)
    this._refreshCurrentUser = this._refreshCurrentUser.bind(this)
    this._refreshDisplayedUser = this._refreshDisplayedUser.bind(this)
  }

  render() {
    if (this.state.networkError) {
      return <div>{this.state.networkError}</div>
    }

    if (!this.state.syntheticLoot) {
      return <div>Loading...</div>
    }

    return (
      <div className="App">
        <Nav connectWallet={() => this._connectWallet()} 
          isConnectingWallet={this.state.isConnectingWallet}
          canConnectWallet={this.state.canConnectWallet}
          currentUser={this.state.currentUser}
          displayedUser={this.state.displayedUser}
          searchQuery={this.state.searchQuery}
          onSearchChange={this._onSearchChange}
          onSearchSubmit={this._onSearch}
          onSelectUser={this._onSelectUser} 
        />
          <Switch>
            <Route path="/account/:addressOrENS" render={ (route) => {
              return <div style={{display: "flex", justifyContent: "center"}}>
                <div style={{marginTop: "50px", marginBottom: "50px"}}>
                  {
                    this.state.displayedUser ? <>
                      <HeaderUser 
                      user={this.state.displayedUser} 
                      currentUser={this.state.currentUser} 
                      provider={this._provider} 
                      refreshUser={this._refreshDisplayedUser}
                      refreshCurrentUser={this._refreshCurrentUser}
                      />

                      <div className="card"  style={{backgroundColor: "white", marginTop: "15px"}}>
                        <img alt="character" style={{borderRadius: "5px", width: "100%"}} src={this.state.displayedUser.character}/>
                        {/* <img alt="loot" style={{borderRadius: "5px"}} src={this.state.displayedUser.lootImage}/> */}
                        <ul style={{marginLeft: "-20px"}}>
                          {this.state.displayedUser.items.map(item => {
                            return <li key={item}>{item}</li>
                          })}
                        </ul>
                      </div>
                    </> : 
                    this.state.isLoading ? <div style={{width: "20px", height: "20px"}} className="spinner"></div> :
                    this.state.userNotFound ? <>
                      {route.match.params.addressOrENS} could not be found :/
                    </> : <></>
                  }
                </div>
              </div>
            }}></Route>
          </Switch>
      </div>
    )
  }

  async componentDidMount() {
    this._initialize()
  }

  componentDidUpdate(prevProps, prevState) {

    const { pathname } = this.props.location;
    const { pathname: prevPathname } = prevProps.location;
    const params = this._getParams(pathname)
    const prevParams = this._getParams(prevPathname)

    if (params.addressOrENS) {
      if (!prevState.ready && this.state.ready) {
        this.updateUser(params.addressOrENS)
        return
      }
      if (params.addressOrENS === prevParams.addressOrENS) {
        return
      }
      this.updateUser(params.addressOrENS)
    }
  }

  _getParams = (pathname) => {
    const matchProfile = matchPath(pathname, {
      path: `/account/:addressOrENS`,
    })
    return (matchProfile && matchProfile.params) || {}
  }

  async _hasAccountConnected() {
    if (!window.ethereum) {
      return false
    }

    const accounts = await window.ethereum.request({method: "eth_accounts"})
    return accounts.length > 0
  }

  async _connectWallet() {
    this.setState({isConnectingWallet: true})
    try {
      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const currentUser = await this._userFromAddress(address)
      this.setState({currentUser})
      this.props.history.push(`/account/${currentUser.address}`)
    } catch (error) {
      console.error(error)
    }
    this.setState({isConnectingWallet: false})
  }

  async _initialize(currentUser) {
    if (window.ethereum) {
      this._provider = new ethers.providers.Web3Provider(window.ethereum)
      this.setState({canConnectWallet: true})
    } else {
      this._provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/f29f1c340a60430ebff33f1ed9dad190")
    }

    await this._loadContracts(this._provider)

    console.log("loaded contract")

    const isConnected = await this._hasAccountConnected()
    if (currentUser === undefined) {
      if (isConnected) {
        await this._connectWallet()
      }
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", ([newAddress]) => {
        if (newAddress === undefined) {
          return this._resetState()
        }
        this._connectWallet()
      })
      
      window.ethereum.on("chainChanged", ([networkId]) => {
        this._resetState()
      })
    }

    if (isConnected) {
      await this._loadContracts(this._provider.getSigner(0))
    }
  }

  async _loadContracts(providerOrSigner) {
    const chainId = await getChainId(this._provider)

    if(!(chainId in deploymentMap.contracts)) {
      this.setState({ 
        networkError: "Contracts not deployed on this network."
      })
      return
    }

    const syntheticLoot = new ethers.Contract(
      deploymentMap.contracts[chainId].SyntheticLoot[0],
      SyntheticLootArtifact,
      providerOrSigner
    )

    console.log(syntheticLoot)

    this.setState({
      syntheticLoot,
      ready: true
    })
  }

  async _onSelectUser(user) {
    this.props.history.push(`/account/${user.address}`)
  }

  async _onSearch(e) {
    e.preventDefault()
    this.props.history.push(`/account/${this.state.searchQuery}`)
    this.setState({searchQuery: "", displayedUser: undefined})
  }

  async _onSearchChange(e) {
    this.setState({searchQuery: e.target.value})
  }

  async _refreshCurrentUser() {
    const currentUser = await this._userFromAddress(this.state.currentUser.address)
    this.setState({currentUser})
  } 

  async _refreshDisplayedUser() {
    const displayedUser = await this._userFromAddress(this.state.displayedUser.address)
    this.setState({displayedUser})
  }

  async updateUser(addressOrENS) {

    if (this.state.displayedUser && (this.state.displayedUser.address === addressOrENS || this.state.displayedUser.ens === addressOrENS)
    ) {
      return
    }

    this.setState({isLoading: true})

    let user
    try {
      if (addressOrENS.slice(0,2) === "0x") {
        user = await this._userFromAddress(addressOrENS)
      } else {
        user = await this._userFromENS(addressOrENS)
      }
    } catch (error) {
      console.log(error)
    }

    if (!user) {
      if (!this.state.userNotFound) {
        this.setState({
          userNotFound: true,
          displayedUser: null,
          isLoading: false
        })
      }
      return
    }

    this.setState({
      searchQuery: "",
      displayedUser: user, 
      userNotFound: false,
      isLoading: false
    })
  }

  async _userFromENS(name) {
    const userAddress = await this._provider.resolveName(name);
    const user = await this._userFromAddress(userAddress)
    return user
  }

  async _userFromAddress(address) {
    const tokenURIB64 = await this.state.syntheticLoot.tokenURI(address)
    const tokenURI = JSON.parse(Buffer.from(tokenURIB64.split(",")[1], 'base64').toString("utf8"))
    const b64svg = tokenURI.image
    const svg = Buffer.from(b64svg.split(",")[1], 'base64').toString("utf8")
    const ens = await this._provider.lookupAddress(address);

    const items = itemsFromSvg(svg)
    console.log(items)
    const img = await getImageForLoot(items)
    console.log(img)

    return {
      address: address.toLowerCase(),
      lootImage: b64svg,
      character: img,
      items,
      ens
    }
  }

  _dismissNetworkError() {
    this.setState({ networkError: undefined })
  }

  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message
    }

    return error.message
  }

  _resetState() {
    this.setState(this.initialState)
    this._initialize()
  }
}

export default {
  Dapp: withRouter(Dapp)
}