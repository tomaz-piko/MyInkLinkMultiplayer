import React, {Component} from 'react';
import { 
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    Form,
    FormGroup,
    Label,
    Alert,
    Input
} from 'reactstrap';
import axios from 'axios';

class RegisterUserModal extends Component {
    state = {
        modal: false,
        username: '',
        email: '',
        password: '',
        repeatPassword: '',
        msg: null
    }

    toggle = () => {
        this.setState({
            modal: !this.state.modal
        });
    }
  
    changeHandler = e => {
        this.setState({[e.target.name]: e.target.value})
    }
  
    submitHandler = e => {
        e.preventDefault()
        const {username, email, password, repeatPassword} = this.state;

        if(password !== repeatPassword) {
            this.setState({msg: 'Passwords do not match.'});
            return;
        }

        const user = {
            username,
            email,
            password
        }
        
        axios
            .post('/users', user)
            .then(res => {
                this.toggle();
            })
            .catch(err => {
                this.setState({
                    msg: err.response.data.msg
                });
            })
    }

    render() {       
        return (
            <div className="RegisterUserModal">
                <Button onClick={this.toggle}>Register</Button>

                <Modal
                    isOpen={this.state.modal}
                    toggle={this.toggle}
                >
                <ModalHeader toggle={this.toggle}>Register user!</ModalHeader>
                    <ModalBody>
                        { this.state.msg ? <Alert color="danger">{this.state.msg}</Alert> : null}
                        <Form onSubmit={this.submitHandler}>
                            <FormGroup>
                                <Label for="username">Username:</Label>
                                <Input
                                    type="text"
                                    name="username"
                                    id="username"
                                    placeholder="Enter username"
                                    onChange={this.changeHandler}>
                                </Input>
                            </FormGroup>
                            <FormGroup>
                                <Label for="email">Email:</Label>
                                <Input
                                    type="text"
                                    name="email"
                                    id="email"
                                    placeholder="Enter email"
                                    onChange={this.changeHandler}>
                                </Input>
                            </FormGroup>
                            <FormGroup>
                                <Label for="password">Passsword:</Label>
                                <Input
                                    type="password"
                                    name="password"
                                    id="password"
                                    placeholder="Enter password"
                                    onChange={this.changeHandler}>
                                </Input>
                            </FormGroup>
                            <FormGroup>
                                <Label for="repeatPassword">Repeat password:</Label>
                                <Input
                                    type="password"
                                    name="repeatPassword"
                                    id="repeatPassword"
                                    placeholder="Repeat password"
                                    onChange={this.changeHandler}>
                                </Input>
                            </FormGroup>
                            <div className="text-center">
                                <Button type="submit">Register</Button>
                            </div>                         
                        </Form>
                    </ModalBody>
                </Modal>
            </div>
        );
    }
}
  
export default RegisterUserModal;