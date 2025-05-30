import React from 'react';
import { useRef, useState, useEffect} from 'react';
import axios from './api/axios';
import './Login.css'
import useAuth from './hooks/useAuth';
import { setLocalStorage } from './hooks/localStorage';
import { Link } from 'react-router-dom';


const Login = () => {
    const { setAuth } = useAuth();
    const userRef = useRef();
    const errRef = useRef();

    const [user, setUser] = useState('');
    const [pwd, setPwd] = useState('');
    const [errMsg, setErrMsg] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {userRef.current?.focus();}, [])

    useEffect(() => {setErrMsg('');}, [user, pwd])

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('/alfalfa/auth/login/' + user,
                JSON.stringify({ email: user, hashed_password: pwd }),
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                }
            );

            const accessToken = response?.data?.access_token;
            console.log(response)
            console.log("Response:", response);
            console.log("Raw data:", response.data);

            const roles = response?.data?.roles;
            setLocalStorage('Token', accessToken, 60);
            setLocalStorage('userID', response?.data?.user_id, 60)
            setLocalStorage('FirstName', response?.data?.first_name, 60);
            setLocalStorage('LastName', response?.data?.last_name, 60);
            
            setAuth({ user, pwd, accessToken });
            setUser('');
            setPwd('');
            setSuccess(true);

        } catch (err) {
            console.error("Caught error:", err);
            console.error("Error message:", err.message);
            console.error("Error response:", err.response);

            if (!err.response) {
                setErrMsg('No Server Response');
            } else if (err.response?.status === 400) {
                setErrMsg('Missing Username or Password');
            } else if (err.response?.status === 401) {
                setErrMsg('Unauthorized');
            } else {
                setErrMsg('Login Failed');
            }
            errRef.current.focus();
        }
    }

    return (
        <>
            {success ? (
                <div className='loading'>
                    <div >Signing In…</div>
                    <br />
                    <div className='hide'>
                        {window.location.href = "/farm"}
                    </div>
                </div>
            ) : (
                <section>
                    <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"} aria-live="assertive">{errMsg}</p>
                    <h1>Login</h1>
                    <form className='AuthForm' onSubmit={handleSubmit}>
                        <label htmlFor="username">Email:</label>
                        <input
                            type="text"
                            id="username"
                            ref={userRef}
                            autoComplete="off"
                            onChange={(e) => setUser(e.target.value)}
                            value={user}
                            required
                        />

                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            onChange={(e) => setPwd(e.target.value)}
                            value={pwd}
                            required
                        />
                        <button className='AuthBottun' >Sign In</button>
                    </form>
                    <p>
                        Need an Account?<br />
                        <span className="line">
                            <Link to="/auth/register">Sign Up</Link>
                        </span>
                    </p>
                </section>
            )}
        </>
    )
}

export default Login