import '../App.css';
import {Component, Fragment} from 'react';
import {
    Container,
    Row,
    Col,
    ListGroup,
    ListGroupItem,
    Button
} from 'reactstrap';
import axios from 'axios';
import CreateRoomModalWithRouter from '../components/CreateRoomModal';
import {confirmAlert} from 'react-confirm-alert';
import uuid from 'react-uuid';
import 'react-confirm-alert/src/react-confirm-alert.css';

class Lobby extends Component {
    state = {
        roomsLoaded: false,
        roomsMsg: 'No rooms available...',
        rooms: null,
        selectedRoom: null,
        userLoaded: false,
        user: null
    }

    changeSelectedRoom = room => {
        if (!this.state.selectedRoom) {
            this.setState({
                selectedRoom: room
            })
        }
        else if(this.state.selectedRoom._id === room._id){
            this.setState({
                selectedRoom: null
            })
        }
        else {
            this.setState({
                selectedRoom: room
            })
        }
    }

    componentDidMount = () => {
        axios
            .get('/rooms')
            .then(res => {
                this.setState({
                    roomsLoaded: true,
                    roomsMsg: (res.data.rooms.length > 0) ? 'Available rooms' : 'No rooms available...',
                    rooms: res.data.rooms
                })
            })
            .catch(err => console.log(err));
        axios
            .get(`/users/user/${sessionStorage.getItem('user')}`)
            .then(res => {
                this.setState({
                    userLoaded: true,
                    user: res.data.user
                })
            })
            .catch(err => console.log(err));
    }

    joinSelectedRoom = () => {
        if(!this.state.selectedRoom) return;
        const {name} = this.state.selectedRoom;
        axios
            .patch(`/rooms/join/${name}`)
            //If successfull redirects to room.
            .then(res => {
                if(res.status === 200) {
                    this.props.history.push(`/Room?room=${name}&host=0`)
                }
            })
            .catch(err => {
                //Alert message.
                confirmAlert({
                    title: 'Error',
                    message: err.response.data.msg,
                    buttons: [
                        {label: 'Ok'}
                    ]
                })
            }) 
    }

    render() {
        const {userLoaded, user, roomsLoaded, roomsMsg, rooms, selectedRoom} = this.state;
        const listRooms = (
            <Fragment>
                {roomsLoaded ? (
                    <ListGroup>
                        {rooms.map(room => (
                            <ListGroupItem
                                key={room._id}
                                onClick={this.changeSelectedRoom.bind(this, room)}
                                className={
                                    (selectedRoom ? selectedRoom._id : '') === room._id ? 'active' : ''}
                             >
                                <Row>
                                    <Col className="text-left">
                                        {room.name}
                                    </Col>
                                    <Col className="text-right">
                                        {room.playerCount} / 8
                                    </Col>    
                                </Row>
                                <Row className={(selectedRoom ? selectedRoom._id : '') === room._id ? '' : 'd-none'}>
                                    <Col className="text-left">
                                        {room.players.map(player => (
                                            <Fragment key={uuid()}>
                                                <span className="smallText"> - {player}</span>
                                                <br></br>
                                            </Fragment>
                                        ))}
                                    </Col>                                   
                                </Row>
                            </ListGroupItem>
                        ))}
                    </ListGroup>
                    ) : ''}
            </Fragment>
        );
        const userInfo = (
            <Fragment>
                {userLoaded ? (
                    <ul>
                        <li><b>Games played: </b>{user.gamesPlayed}</li>
                        <li><b>Rounds played: </b>{user.roundsPlayed}</li>
                        <li><b>Total point: </b>{user.totalPoints}</li>
                        <li><b>Avg pts / round: </b>{user.avgPtsPerRound}</li>
                    </ul>
                ) : 'Stats unavailable'}
            </Fragment>
        );

        return(
            <Container className="Lobby">
                <Row className="row justify-content-center lobbyTitle">
                    <h1>MyInkLink Lobby</h1>
                </Row>
                <hr></hr>
                <Row style={{marginBottom: 20}} className="row justify-content-center">
                    <Col md="4" className="text-left">
                        <h3>{roomsMsg}</h3>                        
                    </Col>
                    <Col md="2" className="text-right">
                        <CreateRoomModalWithRouter>Create room</CreateRoomModalWithRouter>
                    </Col>
                </Row>
                <Row style={{marginBottom: 20}} className="row justify-content-center">
                    <div className="userInfo">
                        <span className="bigText">{sessionStorage.getItem('user')}</span>
                        <hr></hr>
                        {userInfo}
                    </div>                
                    <Col md="6">
                        {listRooms}
                    </Col>
                </Row>
                <Row className="row justify-content-center">
                    <Col className="text-center">
                        <Button
                            onClick={this.joinSelectedRoom.bind(this)}
                        >Join room</Button>
                    </Col>
                </Row>
            </Container>
        );
    }
}

export default Lobby;