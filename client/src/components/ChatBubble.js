import '../App.css';
import {Component, Fragment} from 'react';

class ChatBubble extends Component {
    render() {
        const {user, message} = this.props.data;

        const serverMsg = (
            <Fragment>
                <span style={{color: 'blue'}}>{message}</span>
            </Fragment>
        );
        
        const chatMsg = (
            <Fragment>
                <b>{user}:</b><br></br>
                {message}  
            </Fragment>           
        );
        
        return(
            <div className="ChatBubble">
                {user === 'Server' ? serverMsg : chatMsg}
            </div>
        )
    }
}

export default ChatBubble;