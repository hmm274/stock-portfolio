import {Link} from "react-router-dom";

const NotFound = ()=>{
    return(
        <div>
            <h1>404 - Not Found!</h1>
            <p>Return to <Link to="/">Home</Link></p>
        </div>
    );
}

export default NotFound;