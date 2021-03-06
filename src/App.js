import React, {Component} from 'react';
import './App.css';
import {Connect} from 'uport-connect'
import Light from './contracts/Light.json'
import Web3_Infura from 'web3'
import Loader from 'halogen/PulseLoader'
const appName = 'EthereumDeskLight'
const connect = new Connect(appName, {network: 'rinkeby'})
const web3 = connect.getWeb3()
const web3_infura = new Web3_Infura(new Web3_Infura.providers.HttpProvider("https://rinkeby.infura.io/VZsYunSESc4loDSYnBGr"))

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      status: 'loading',
      pastTransactions: [],
      message: '...',
      block: '...',
      inputMessage: '',
      error: '',
      thanks: ''
    };
  }

  componentDidMount() {

    const StatusContract = web3.eth.contract(Light.abi);
    const statusInstance = StatusContract.at(Light.networks["4"].address)

    this.setState({statusInstance: statusInstance})
    this.getLogs()
    setInterval(this.getLogs.bind(this), 10000)

  }

  getLogs () {
    web3_infura.eth.getPastLogs({address: Light.networks["4"].address, fromBlock: web3._extend.utils.toHex(807850), toBlock: "latest"}).then(this.trySomething.bind(this));
  }

  trySomething(e) {
    var splitstring = e[e.length - 1].data.substring(2).match(/.{1,64}/g);
    this.setState({
      pastTransactions: e,
      status: (web3._extend.utils.toDecimal(splitstring[1]))
        ? true
        : false,
      message: web3._extend.utils.toAscii(e[e.length - 1].data.substring(2).match(/.{1,64}/g)[5]),
      blockNumber: e[e.length - 1].blockNumber,
      thanks: (e.length > this.state.pastTransactions.length) ? '' : this.state.thanks
    })
  }

  someFunction() {
    web3_infura.eth.filter({fromBlock: 0, toBlock: 'latest', address: Light.networks["4"].address}).watch((error, result) => {
      // console.log(result)
    })
  }

  lightStatus() {

    if (this.state.status === 'loading') {
      return (
        <div className="Status-div">
          <span className="Status-span">Loading...</span>
          <p>
            <b>Last Message</b>
          </p>
          <p>...</p>
          <p>...</p>
        </div>
      )
    } else if (this.state.status) {
      return (
        <div className="Status-div">
          <span className="Status-span">ON</span>
          <p>
            <b>Last Message</b>
          </p>
          <p>{this.state.message}</p>
          <p>
            <b>Block</b>
          </p>
          <p>{this.state.blockNumber}</p>
        </div>
      )
    } else {
      return (
        <div className="Status-div">
          <span className="Status-span">OFF</span>
          <p>
            <b>Last Message</b>
          </p>
          <p>{this.state.message}</p>
          <p>
            <b>Block</b>
          </p>
          <p>{this.state.blockNumber}</p>
        </div>
      )
    }
  }

  renderAppCSS() {
    if (this.state.status === 'loading') {
      return 'App-loading'
    } else if (this.state.status) {
      return 'App'
    } else {
      return 'App-off'
    }
  }

  renderTransaction(arr, i) {
    if (i !== 0) {
      var splitstring = arr.data.substring(2).match(/.{1,64}/g);
      return (
        <div className={"Transaction-div"} key={i}>
          <p>{'Sender: 0x' + splitstring[0]}</p>
          <p>{(web3._extend.utils.toDecimal(splitstring[1]))
              ? "Status: ON"
              : "Status: OFF"}</p>
          <p>{'Message: ' + web3._extend.utils.toAscii(arr.data.substring(2).match(/.{1,64}/g)[5])}</p>
          <p>{'Block: ' + arr.blockNumber}</p>
          <br/>
        </div>
      )
    }
  }

  renderPastTransaction() {
    if (this.state.pastTransactions.length > 0) {
      return this.state.pastTransactions.slice(0).reverse().map(this.renderTransaction)
    } else {
      return <p>Loading...</p>
    }
  }

  isASCII(str) {
    return /^[\x00-\x7F]*$/.test(str);
  }

  handleMessage(e) {
    if (this.isASCII(e.target.value) && e.target.value.length < 33) {
      this.setState({inputMessage: e.target.value, error: ''})
    } else {
      this.setState({error: 'Keep it under 33 ASCII characters.'})
    }
  }

  renderError() {
    if (this.state.error !== '') {
      return <p className="error">
        <b>{this.state.error}</b>
      </p>
    } else {
      return <p>Enter a message to change the light's status.</p>
    }
  }

  clickButton() {
    if (this.state.inputMessage.length < 1) {
      this.setState({error: 'I need a message!'})
    } else {
      var gas;
      this.state.statusInstance.flick.estimateGas(this.state.inputMessage, (error, result) => {
        gas = result;
      })
      this.state.statusInstance.flick.sendTransaction(this.state.inputMessage, {
        gas: gas*2
      }, (error, txHash) => {
        this.setState({thanks: 'Thanks! It will take a moment to update.', error: '', inputMessage: ''})
      })
    }
  }

  renderThankYou() {
    if (this.state.thanks !== '') {
      return (
        <div className="thanks">
          <Loader color="gray" size="16px" margin="4px"/>
          <p>{this.state.thanks}</p>
        </div>
      )
    }
  }

  render() {
    return (
      <div className={this.renderAppCSS()}>
        <div className="Inner-app">
          <h1>Ethereum Desk Light</h1>
          {this.lightStatus()}
          <div className="Flick-div">
            <h3>
              <b>Flick Light</b>
            </h3>
            {this.renderError()}
            <input value={this.state.inputMessage} onChange={this.handleMessage.bind(this)} placeholder="Your message" style={{
              fontSize: "16px"
            }}/>
            <br/>
            <button onClick={this.clickButton.bind(this)} type="button">{(this.state.status)
                ? "TURN OFF"
                : "TURN ON"}</button>
            {this.renderThankYou()}
          </div>
          <div className="FAQ-div">
            <h3>
              <b>FAQ</b>
            </h3>
            <p>
              <b>Is this light real?</b>
            </p>
            <p>Yes, this light lives on my desk and is controlled via a Raspberry Pi and a relay.</p>
            <br/>
            <p>
              <b>How is this connected?</b>
            </p>
            <p>This light is connected to via the Ethereum Rinkeby testnet. It uses a smart contract to dictate its current state.</p>
            <br/>
            <p>
              <b>What is the future of the light?</b>
            </p>
            <p>This light wants to live on the Ethereum mainnet and would like to give away a coin for everyone who interacts with it, but will live here until Metropolis.</p>
            <br/>
            <p>
              <b>Does this work with Metamask or Mist?</b>
            </p>
            <p>No. At the moment you must use <a href="https://www.uport.me/signup">Uport's Alpha app</a>. I will migrate this to regular web3 shortly.</p>
          </div>
          <div>
            <h3>
              <b>Past Transactions</b>
            </h3>
            {this.renderPastTransaction()}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
