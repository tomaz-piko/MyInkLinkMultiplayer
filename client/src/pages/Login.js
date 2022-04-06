import '../App.css';
import {Component} from 'react';
import {
    Container,
    Form,
    FormGroup,
    Button,
    Input,
    Alert,
    Label,
    Row,
    Col
} from 'reactstrap';
import axios from 'axios';
import RegisterUserModal from '../components/RegisterUserModal';

class Login extends Component {
    state = {
        username: '',
        password: '',
        msg: null
    }

    changeHandler = e => {
        this.setState({
            [e.target.name]: e.target.value 
        });
    }

    submitHandler = e => {
        e.preventDefault()

        const {username, password} = this.state;
        const user = {username, password};
        axios
            .post('/auth', user)
            .then(res => {
                sessionStorage.setItem('user', username);
                this.props.history.push('/Lobby');
            })
            .catch(err => {
                this.setState({
                    msg: err.response.data.msg
                });
            })
    }

    render() {
        return (
        <Container className="Login">
            <Row className="row justify-content-center">
                <h1>Login!</h1>
            </Row>
            <Row className="row justify-content-center">
                <Col md="4">
                    { this.state.msg ? <Alert color="danger">{this.state.msg}</Alert> : null}
                    <Form onSubmit={this.submitHandler}>
                        <FormGroup>
                            <Label for="username">Username:</Label>
                            <Input
                            type="text"
                            id="username"
                            name="username"
                            placeholder="Input username"
                            onChange={this.changeHandler}
                            ></Input>
                        </FormGroup>
                        <FormGroup>
                            <Label for="password">Password:</Label>
                            <Input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Input password"
                            onChange={this.changeHandler}
                            ></Input>
                        </FormGroup>
                        <div className="text-center">
                            <Button type="submit">Login</Button>
                        </div>
                    </Form>
                </Col>
            </Row>
            <hr></hr>
            <Row className="row justify-content-center">
                <Col md="6" className="text-center">
                    <h5>Dont have an account yet? Register here!</h5>
                    <RegisterUserModal>Register</RegisterUserModal>
                </Col>
            </Row>              
        </Container>       
        );
    }  
}

export default Login;
