import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Component} from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import Room from './pages/Room';

class App extends Component {
  render() {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Login />}></Route>
          <Route path="/Lobby" element={<Lobby />}></Route>
          <Route path="/Room" element={<Room />}></Route>
        </Routes>
      </Router>
    );
  }  
}

export default App;
