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
import PropTypes from "prop-types";
import {withRouter} from 'react-router';


class CreateRoomModal extends Component {
    state = {
        modal: false,
        name: '',
        msg: null
    }

    static propTypes = {
        match: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired
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
        const {name} = this.state;

        if(name.length <= 3) {
            this.setState({msg: 'Please input a name longer than 3 characters.'});
            return;
        }

        const room = {
            name,
            host: sessionStorage.getItem('user')
        }
        
        axios
            .post('/rooms', room)
            .then(res => {
                if(res.status === 200) {
                    this.toggle();
                    const roomName = res.data.room.name;
                    this.props.history.push(
                        `/Room?room=${roomName}&host=1`           
                    )
                }
            })
            .catch(err => {
                console.log(err);
                if(err.response) {
                    this.setState({
                        msg: err.response.data.msg
                    });
                }
                else {
                    console.log(err);
                }
            })
    }

    render() {       
        return (
            <div className="CreateRoomModal">
                <Button onClick={this.toggle}>Create room</Button>
                
                <Modal
                    isOpen={this.state.modal}
                    toggle={this.toggle}
                >
                <ModalHeader toggle={this.toggle}>Create room!</ModalHeader>
                    <ModalBody>
                        { this.state.msg ? <Alert color="danger">{this.state.msg}</Alert> : null}
                        <Form onSubmit={this.submitHandler}>
                            <FormGroup>
                                <Label for="name">Name:</Label>
                                <Input
                                    type="text"
                                    name="name"
                                    id="name"
                                    placeholder="Enter name"
                                    onChange={this.changeHandler}>
                                </Input>
                            </FormGroup>                                                                               
                            <div className="text-center">
                                <Button type="submit">Create</Button>
                            </div>                         
                        </Form>
                    </ModalBody>
                </Modal>
            </div>
        );
    }
}
  
//export default CreateRoomModal;
const CreateRoomModalWithRouter = withRouter(CreateRoomModal);
export default CreateRoomModalWithRouter;