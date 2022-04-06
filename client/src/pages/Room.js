import '../App.css';
import {Component, createRef} from 'react';
import io from 'socket.io-client';
import {
    Container,
    Row,
    Col,
    Button,
    Form,
    InputGroup,
    InputGroupAddon,
    Input
} from 'reactstrap';
import ChatBubble from '../components/ChatBubble';
import uuid from 'react-uuid';
import queryString from 'query-string';
import failSfx from '../sounds/fail.wav';
import victorySfx from '../sounds/triump_victory.mp3';
import successSfx from '../sounds/success.mp3';

class Room extends Component {
    messagesEndRef = createRef();
    canvasRef = createRef();
    contextRef = createRef();
    successAudio = new Audio(successSfx);
    failAudio = new Audio(failSfx);
    victoryAudio = new Audio(victorySfx);

    state = {
        socket: io(),
        chatHistory: [],
        drawBuffer: [],
        userMsg: '',
        isHost: false,
        isDrawing: false,
        isOnTurn: false,
        statusMessage: ''
    }

    setupCanvas() {
        const canvas = this.canvasRef.current;
        const width = 616; //Hardcoded
        const height = 568;
        canvas.width = width * 2;
        canvas.height = height * 2;       
        //canvas.style.width = `${window.innerWidth}px`;
        canvas.style.width = `${width}px`;
        //canvas.style.height = `${window.innerHeight}px`;
        canvas.style.height = `${height}px`;
        const context = canvas.getContext("2d");
        context.scale(2, 2);
        context.lineCap = "round";
        context.strokeStyle = "black";
        context.lineWidth = 5;
        this.contextRef.current = context;
    }

    scrollToBottom = () => {
        this.messagesEndRef.current.scrollIntoView({behavior: 'smooth'})
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }

    changeHandler = e => {
        this.setState({
            [e.target.name]: e.target.value
        })
    }

    componentDidMount = () => {
        this.setupCanvas();
        const {socket} = this.state;
        //Join room.
        //'joinRoom', ({room, user})
        const query = queryString.parse(this.props.location.search)       
        const obj = {
            room: query.room,
            user: sessionStorage.getItem('user')
        }
        socket.emit('joinRoom', obj);
        if(query.host === '1') {
            this.setState({isHost: true});
        }

        socket.on('statusMessage', message => {
            this.setState({
                statusMessage: message
            })
        })

        //Message from server.
        socket.on('serverMessage', message => {
            const {chatHistory} = this.state;
            chatHistory.push({'user': 'Server', 'message': message});
            this.setState({
                chatHistory: chatHistory
            });
        })
        //Chat message from other people.
        socket.on('chatMessage', message => {
            const {chatHistory} = this.state;           
            chatHistory.push(message);
            this.setState({
                chatHistory: chatHistory
            });
        })
        //Game on received draw
        socket.on('drawBuffer', drawBuffer => {
            this.drawBufferToCanvas(drawBuffer);
        })
        //Game on guess response
        socket.on('guessResponse', result => {
            if(result.status === "SUCCESS") {
                console.log("Play guess success sound");
                this.successAudio.play();
            }
            else if(result.status === "FAIL") {
                console.log("Play guess fail sound");
                this.failAudio.play();
            }
        });
        //Allow drawing
        socket.on('allowDrawing', () => {
            this.setState({
                isOnTurn: true
            })
        });
        //Dissallow drawing
        socket.on('disallowDrawing', () => {
            this.setState({
                isOnTurn: false
            })
        });
        //Canvas clear
        socket.on('canvasClear', () => {
            this.contextRef.current.clearRect(0, 0, 616, 568);
        });
        //Results
        socket.on('gameResults', results => {
            console.log(results);
            this.victoryAudio.play();
        })
    }

    sendCommand = (msg) => {
        const {socket} = this.state;
        const query = queryString.parse(this.props.location.search)
        if(msg.message === "/start") {           
            if(query.host === "1") {
                socket.emit('gameStart', {msg: msg, room: query.room});
            }
        }
        else if(msg.message.split(' ')[0] === "/g") {
            msg.message = msg.message.split(' ')[1];
            socket.emit('gameGuess', {msg: msg, room: query.room});
        }
        else {
            console.log("unknown command");
        }
    }

    sendMsgHandler = e => {
        e.preventDefault();
        const {userMsg, socket} = this.state;    
        const msg = {'user': sessionStorage.getItem('user'), 'message': userMsg};

        if(msg.message.charAt(0) === '/') {
            this.sendCommand(msg);
        }
        else {
            const query = queryString.parse(this.props.location.search)
            socket.emit('chatMessage', {msg: msg, room: query.room});
        }
        this.setState({
            userMsg: ''
        })
    }

    drawBufferToCanvas = (drawBuffer) => {
        const startX = drawBuffer[0].offsetX;
        const startY = drawBuffer[0].offsetY;
        this.contextRef.current.beginPath();
        this.contextRef.current.moveTo(startX, startY);
        for(let i = 1; i < drawBuffer.length; i++) {
            const offsetX = drawBuffer[i].offsetX;
            const offsetY = drawBuffer[i].offsetY;
            this.contextRef.current.lineTo(offsetX, offsetY);
            this.contextRef.current.stroke();
        }   
    }

    addToDrawBuffer = (offsetX, offsetY) => {
        const {drawBuffer} = this.state;
        drawBuffer.push({offsetX, offsetY})
        if(drawBuffer.length === 100) {
            this.emitBufferToServer();
            return;
        }
        this.setState({drawBuffer: drawBuffer});
    }

    emitBufferToServer = () => {
        const {drawBuffer, socket} = this.state;
        const room = queryString.parse(this.props.location.search)
        socket.emit('drawBuffer', {drawBuffer, room: room.room});      
        this.setState({drawBuffer: []});
    }

    startDrawing = ({nativeEvent}) => {
        if(this.state.isOnTurn) {
            const {offsetX, offsetY} = nativeEvent;
            this.contextRef.current.beginPath();
            this.contextRef.current.moveTo(offsetX, offsetY);
            this.setState({isDrawing: true});
            this.addToDrawBuffer(offsetX, offsetY);
        }
    }

    stopDrawing = () => {
        if(this.state.isOnTurn) {
            this.contextRef.current.closePath();
            this.setState({isDrawing: false});
            this.emitBufferToServer();
        }       
    }

    draw = ({nativeEvent}) => {
        if(this.state.isOnTurn) {
            if(!this.state.isDrawing) {
                return;
            }
            const {offsetX, offsetY} = nativeEvent;
            this.contextRef.current.lineTo(offsetX, offsetY);
            this.contextRef.current.stroke();
            this.addToDrawBuffer(offsetX, offsetY);
        }
    }

    render() {
        const {chatHistory, isHost, statusMessage} = this.state; 

        const chatInputWindow = (
            <Form onSubmit={this.sendMsgHandler}>   
                <InputGroup>
                    <Input
                        type="text"
                        id="userMsg"
                        name="userMsg"
                        placeholder="Type message..."
                        value={this.state.userMsg}
                        onChange={this.changeHandler}
                    ></Input>
                    <InputGroupAddon addonType="append">
                        <Button type="submit">Send</Button>
                    </InputGroupAddon>                  
                </InputGroup>                                                       
            </Form>
        )

        return (
            <div className="Room">                
                    <Container id="gameWindow">
                        <Row className="row justify-content-center">
                            <Col md="8" className="text-center">
                                <h1>{sessionStorage.getItem('user')} {isHost ? ' (HOST)' : ''}</h1>
                            </Col>                      
                        </Row>
                        <Row className="row justify-content-center">
                            <Col md="8" className="text-center">
                                <h4>{statusMessage}</h4>
                            </Col>                      
                        </Row>
                        <Row id="innerGameWindow">
                            <Col id="chatWindow" md="4">
                                <div id="chatHistory">
                                    {chatHistory.map((message) => (
                                        <ChatBubble data={message} key={uuid()}></ChatBubble>
                                    ))}
                                    <div ref={this.messagesEndRef}></div>
                                </div>                               
                                <div id="chatInput">
                                    {chatInputWindow}
                                </div>
                            </Col>
                            <Col md="7">
                                <canvas 
                                    id="myCanvas"
                                    onMouseDown={this.startDrawing}
                                    onMouseUp={this.stopDrawing}
                                    onMouseMove={this.draw}
                                    ref={this.canvasRef}
                                ></canvas>
                            </Col>
                        </Row>
                    </Container>
                </div>
        )
    }
}

export default Room;