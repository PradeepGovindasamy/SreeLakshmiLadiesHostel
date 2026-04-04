import { useState } from "react";
import axios from "axios";

function Login() {
  const [username, setUsername] = useState('');  // Can be username or email
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/token/', {
        username,  // Backend accepts email or username in this field
        password
      });
      alert('Login successful!');
      console.log(response.data);
      localStorage.setItem('access', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);
    } catch (error) {
      alert('Login failed - Invalid email/username or password');
      console.error(error);
    }
  };

  return (
    <div>
      <input 
        placeholder="Email or Username" 
        value={username} 
        onChange={e => setUsername(e.target.value)} 
      />
      <input 
        placeholder="Password" 
        type="password" 
        value={password} 
        onChange={e => setPassword(e.target.value)} 
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;
