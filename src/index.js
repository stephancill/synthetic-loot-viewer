import React from "react";
import ReactDOM from "react-dom";
import { HashRouter } from "react-router-dom"
import Dapp from "./components/Dapp";

// This is the entry point of your application, but it just renders the Dapp
// react component. All of the logic is contained in it.

ReactDOM.render(
  <React.StrictMode>
    <HashRouter>
      <Dapp.Dapp />
    </HashRouter>
  </React.StrictMode>,
  document.getElementById("root")
);
