import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Component} from 'react';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import Room from './pages/Room';

class App extends Component {
  render() {
    return (
      <Router>
        <Switch>
          <Route path="/" component={Login} exact></Route>
          <Route path="/Lobby" component={Lobby}></Route>
          <Route path="/Room" component={Room}></Route>
        </Switch>
      </Router>
    );
  }  
}

export default App;
