'use strict';

const walletLib = (function () {
  let web3Modal;
  let provider;
  let selectedAccount;
  let handlersIndex = 0;
  const handlers = {};

  const Web3Modal = window.Web3Modal.default;
  const WalletConnectProvider = window.WalletConnectProvider.default;

  async function initialize() {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: Config.options.walletconnect
      }
    };

    web3Modal = new Web3Modal({
      cacheProvider: true,
      providerOptions
    });

    if (web3Modal.cachedProvider) {
      _connectInternal();
    }
    notifyStatusUpdates();
  }

  async function _connectInternal() {
    provider = await web3Modal.connect();

    provider.on('accountsChanged', (accounts) => {
      updateSelectedAccount().then();
    });

    provider.on('chainChanged', (chainId) => {
      // Refresh window when chain is changed
      window.location.refresh();
    });

    provider.on('networkChanged', (networkId) => {
      // Refresh window when chain is changed
      window.location.refresh();
    });
    updateSelectedAccount().then();
  }

  async function updateSelectedAccount() {
    const web3 = new Web3(provider);

    const accounts = await web3.eth.getAccounts();
    selectedAccount = accounts[0];

    notifyStatusUpdates();
  }

  async function connectToWallet() {
    if (provider) {
      console.log('Already Connected');
    }
    await _connectInternal();
  }

  async function disconnectWallet() {
    if (!provider) {
      console.log('Not connected yet');
    }

    if (provider.close) {
      await provider.close();
    }

    try {
      // If the cached provider is not cleared,
      // WalletConnect will default to the existing session
      // and does not allow to re-scan the QR code with a new wallet.
      // Depending on your use case you may want or want not his behavir.
      await web3Modal.clearCachedProvider();
    } catch (ex) {

    }
    provider = null;

    selectedAccount = null;
    notifyStatusUpdates();
  }

  function notifyStatusUpdates() {
    for (const key in handlers) {
      if (handlers.hasOwnProperty(key)) {
        try {
          handlers[key]();
        } catch (ex) {
        }
      }
    }
  }

  window.addEventListener('load', async () => {
    await initialize();
  });

  function isConnected() {
    return provider && selectedAccount;
  }
  // Account status, ...
  function addChangeListener(handler) {
    const key = 'listener_' + handlersIndex;
    handlers[key] = handler;
    handlersIndex++;
    return key;
  }

  function removeChangeListener(key) {
    if (handlers[key]) {
      delete handlers[key];
    }
  }

  function getAccountInfo() {
    return {provider, selectedAccount};
  }


  return {
    connectToWallet,
    disconnectWallet,
    isConnected,
    addChangeListener,
    removeChangeListener,
    getAccountInfo
  };
})();


