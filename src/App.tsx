import React, { FunctionComponent, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import './App.css';

import Home from './scenes/Home';
import Admin from './scenes/Admin';

import { requestAccount } from './helpers';

const App: FunctionComponent = () => {
  console.log('REACT_APP_CHAIN_ID', process.env.REACT_APP_CHAIN_ID);

  useEffect(() => {
    requestAccount();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
